import createDebugLogger from 'debug';
import {hasFields, getSubfield, getSubfieldValues, getDefaultMissValue} from './collectFunctions/collectUtils.js';
import {hasIdMismatch, normalizeMelindaId, nvdebug} from './utils.js';

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
  const f973 = getX73(record, '973');
  return [...f773, ...f973];
}

export function check773({record1, record2}) {
  const data1 = get773(record1);
  const data2 = get773(record2);
  return compare773values(data1, data2);
}

function compare773values(f773sA, f773sB) {

  debugDev('Collected f773s: %o vs %o', f773sA, f773sB);
  nvdebug('compare773values() in...', debugDev);
  nvdebug(JSON.stringify(f773sA), debugDev);
  nvdebug(JSON.stringify(f773sB), debugDev);

  // Fail if one of the records has multiple 773/973 fields:
  // (Multiple 773 fields means that it's a Viola record, or that some weeding is need first.)
  if (f773sA.length > 1 || f773sB.length > 1) {
    return false;
  }
  // Fail if one of the fields is 973
  if (f773sA.some(val => val.tag === '973') || f773sB.some(val => val.tag === '973')) {
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

  return innerCompare(f773sA[0], f773sB[0]);

  function noMultivals(val1, val2) {
    nvdebug(`compare '${val1}' vs '${val2}' (default: '${undefinedHack}')`, debugDev);
    return val1 === val2 || !val1 || !val2 || val1 === undefinedHack || val2 === undefinedHack;
  }

  function acceptControlNumbers(nums1, nums2) {
    return !(nums1.some(val => hasIdMismatch(val, nums2)) || nums2.some(val2 => hasIdMismatch(val2, nums1)));
  }

  function innerCompare(data1, data2) {
    const recordControlNumbers = acceptControlNumbers(data1.recordControlNumbers, data2.recordControlNumbers);
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
  return compare773values(f773sA, f773sB);
}
