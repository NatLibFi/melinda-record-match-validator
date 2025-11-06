import createDebugLogger from 'debug';
import {hasFields, getSubfield, getSubfieldValues, getDefaultMissValue} from './collectFunctions/collectUtils';
import {hasIdMismatch, hasIdMatch, splitIds, normalizeMelindaId, nvdebug} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field773');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

function getX73(record, paramTag) {
  // Tag should be 773 or 973. Add sanity check?
  const F773s = hasFields(paramTag, record, f773ToJSON);
  debugDev('Field %ss: %o', paramTag, F773s);

  return F773s;

  function f773ToJSON(f773) {
    // NB! Test multiple 773 fields as well!

    const tag = paramTag;
    // NB! It is legal to have multiple $w subfields in a field!
    // Eg. We oft see both Arto and Melinda ID in the same record.
    const recordControlNumbers = getRecordControlNumbers(f773);
    // $g and $q are non-repeatable:
    const relatedParts = getSubfield(f773, 'g');
    const enumerationAndFirstPage = getSubfield(f773, 'q');

    return {tag, recordControlNumbers, relatedParts, enumerationAndFirstPage};
  }

  function getRecordControlNumbers(field) {
    // Get normalized subfields that have an record control number with a source identifier:
    const wSubfields = getSubfieldValues(field, 'w')
      .map(value => normalizeMelindaId(value)) // normalize, though filter would succeed anyway
      .filter(value => !(/^[0-9]+$/u).test(value)); // Filter digit-only values away
    return wSubfields;
  }
}

export function get773(record) { // collect
  const f773 = getX73(record, '773');
  // get also Viola's multihost host link fields from f973
  const f973 = getX73(record, '973');
  return [...f773, ...f973];
}

// failMultipleHostLinks: fail if there are multiple host links in either record
// failF973: fail if record has a f973 (Viola's multihost records have f973 for extra host links)
// requireHostIdMatch: fail if records do not have a common internal host id (incoming record should have pre-created matching host id with database record)
// failHostIdMatch: fail if records have a common internal host id (two database records should generally not have matching host ids)

// default options to original functionality (fail multiples, f973 and id mismatches, but do not require a match)
export function check773({record1, record2, failMultipleHostLinks = true, failF973 = true, requireHostIdMatch = false, failHostIdMatch = false}) {
  const data1 = get773(record1);
  const data2 = get773(record2);
  return compare773values({f773sA: data1, f773sB: data2, failMultipleHostLinks, failF973, requireHostIdMatch, failHostIdMatch});
}

// For internal merge (merging two database records, do not fail multiple f773/f973 or f973 existence
// do not require common internal host id, fail if records have a common internal host id)
export function check773Internal({record1, record2, failMultipleHostLinks = false, failF973 = false, requireHostIdMatch = false, failHostIdMatch = true}) {
  const data1 = get773(record1);
  const data2 = get773(record2);
  return compare773values({f773sA: data1, f773sB: data2, failMultipleHostLinks, failF973, requireHostIdMatch, failHostIdMatch});
}

// default options to original functionality
function compare773values({f773sA, f773sB, failMultipleHostLinks = true, failF973 = true, requireHostIdMatch = false, failHostIdMatch = false}) {

  debugDev('Collected f773s: %o vs %o', f773sA, f773sB);
  nvdebug('compare773values() in...', debugDev);
  nvdebug(JSON.stringify(f773sA), debugDev);
  nvdebug(JSON.stringify(f773sB), debugDev);

  // Fail if one of the records has multiple 773/973 fields:
  // (Multiple 773 fields means that it's a Viola record, or that some weeding is need first.)
  if (failMultipleHostLinks && (f773sA.length > 1 || f773sB.length > 1)) {
    return false;
  }
  // Fail if one of the fields is 973
  if (failF973 && (f773sA.some(val => val.tag === '973') || f773sB.some(val => val.tag === '973'))) {
    return false;
  }

  /*
  if (f773sA.length > 0 && f773sB.length === 0) {
    return true; // return 'A';
  }

  if (f773sB.length > 0 && f773sA.length === 0) {
    return true; // return 'B';
  }

  if (f773sA.length === 0 && f773sB.length === 0) {
    return true;
  }
  */
  if (f773sA.length === 0 || f773sB.length === 0) {
    return true;
  }

  const undefinedHack = getDefaultMissValue(); // String 'undefined'

  return innerCompare({data1: f773sA[0], data2: f773sB[0], requireHostIdMatch, failHostIdMatch});

  function noMultivals(val1, val2) {
    nvdebug(`compare '${val1}' vs '${val2}' (default: '${undefinedHack}')`, debugDev);
    return val1 === val2 || !val1 || !val2 || val1 === undefinedHack || val2 === undefinedHack;
  }


  // nums1, nums2 record 773w/973w contents (plain numbers filtered out)
  function acceptControlNumbers({nums1, nums2, requireHostIdMatch, failHostIdMatch}) {
    debugDev(`Comparing host controlnumbers: ${JSON.stringify(nums1)} to ${JSON.stringify(nums2)}}`);
    debugDev(`Settings: requireHostIdMatch: ${requireHostIdMatch}, failHostIdMatch: ${failHostIdMatch}`);
    // Handling internal host ids depends on requireHostIdMatch and failHostIdMatch parameters
    // - mergeing incoming and database record should have a common internal host id match pre-inserted to incoming record
    // - mergeing two database records should not have a common internal host id if we're merging whole record family
    if (requireHostIdMatch || failHostIdMatch) {
      const {internalIds: internalIds1, otherIds: otherIds1} = splitIds(nums1);
      const {internalIds: internalIds2, otherIds: otherIds2} = splitIds(nums2);

      const internalHostIdMatch = internalIds1.some(val => hasIdMatch(val, internalIds2)) || internalIds2.some(val => hasIdMatch(val, internalIds1));
      const internalHostIdMismatch = internalIds1.some(val => hasIdMismatch(val, internalIds2)) || internalIds2.some(val => hasIdMismatch(val, internalIds1));

      // fail if there is an internal id match we do not want
      if (failHostIdMatch && internalHostIdMatch) {
        return false;
      }

      // fail if there are no internal id matches
      if (requireHostIdMatch && !internalHostIdMatch) {
        return false;
      }

      if (internalHostIdMismatch) {
        return false;
      }
      // true if there are no idMismatches in other host ids between records
      return !(otherIds1.some(val => hasIdMismatch(val, otherIds2)) || otherIds2.some(val2 => hasIdMismatch(val2, otherIds1)));
    }

    // true if there are no idMismatches between records
    return !(nums1.some(val => hasIdMismatch(val, nums2)) || nums2.some(val2 => hasIdMismatch(val2, nums1)));
  }

  function innerCompare({data1, data2, requireHostIdMatch, failHostIdMatch}) {
    const recordControlNumbers = acceptControlNumbers({nums1: data1.recordControlNumbers, nums2: data2.recordControlNumbers, requireHostIdMatch, failHostIdMatch});
    nvdebug(`RECORD CONTROL NUMBERS ${recordControlNumbers}`, debugDev);
    // $g and $q are optional:
    const relatedParts = noMultivals(data1.relatedParts, data2.relatedParts);
    const enumerationAndFirstPage = noMultivals(data1.enumerationAndFirstPage, data2.enumerationAndFirstPage);
    nvdebug(`RCN ${recordControlNumbers}\tRP ${relatedParts ? 'true' : 'false'}\tEAFP ${enumerationAndFirstPage ? 'true' : 'false'}`, debugDev);
    nvdebug(`SOME RESULT: ${enumerationAndFirstPage && recordControlNumbers && relatedParts ? 'true' : 'false'}`, debugDev);
    return enumerationAndFirstPage && recordControlNumbers && relatedParts;
  }
}

export function compare773(recordValuesA = [], recordValuesB = []) {
  const f773sA = recordValuesA['773'];
  const f773sB = recordValuesB['773'];
  return compare773values({f773sA, f773sB});
}
