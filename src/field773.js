/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2020-2022 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-record-match-validator
*
* melinda-record-match-validator program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-record-match-validator is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/
import createDebugLogger from 'debug';
import {hasFields, getSubfield, getSubfieldValues, getDefaultMissValue} from './collectFunctions/collectUtils';
import {fieldToString, isValidMelindaId, normalizeMelindaId, nvdebug, /* sameControlNumberIdentifier,*/ stripControlNumberPart} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field773');

export function get773(record) {
  const F773s = hasFields('773', record, f773ToJSON);
  debug('Field 773s: %o', F773s);

  return F773s;

  function f773ToJSON(f773) {
    // NB! It is legal to have multiple $w subfields in a field!
    // Eg. We oft see both Arto and Melinda ID in the same record.
    // Thus this is a bad idea (even though we have been moving Melinda id first in mass fixes).
    const recordControlNumber = getRecordControlNumber(f773);
    const relatedParts = getSubfield(f773, 'g');
    const enumerationAndFirstPage = getSubfield(f773, 'q');

    return {recordControlNumber, relatedParts, enumerationAndFirstPage};
  }

  function getRecordControlNumber(field) {
    // Get normalized subfields:
    const wSubfields = getSubfieldValues(field, 'w')
      .map(value => normalizeMelindaId(value)) // normalize, though filter would succeed anyway
      .filter(value => isValidMelindaId(value));
    if (wSubfields.length > 0) {
      return wSubfields;
    }
    return getDefaultMissValue();
  }

}

export function check773(record1, record2) {
  // Currently we don't merge records if Viola-specific 973 fields are present.
  const blockerFields1 = record1.get('973');
  const blockerFields2 = record2.get('973');
  if (blockerFields1.length > 0 || blockerFields2.length > 0) {
    return false;
  }

  // Viola's multihosts are sometimes stored in non-standard 973 field.
  const fields1 = record1.get('773');
  const fields2 = record2.get('773');
  if (fields1.length === 0 || fields2.lenght === 0) {
    // I don't think 773 field should determine record preference
    return true;
  }
  // 773$w is so rare, that we don't need to cache these, do we?
  return fields1.every(field => noConflicts(field, fields2)) && fields2.every(field => noConflicts(field, fields1));

  function getRelevantSubfieldWValues(field) {
    // currently return only Melinda IDs. Other fields might be of interest as well...
    const vals = getSubfieldValues(field, 'w').map(val => normalizeMelindaId(val)).filter(val => isValidMelindaId(val));
    vals.forEach(element => nvdebug(`VALS: ${element}`));


    return vals;
  }

  function noConflictBetweenWSubfields(fieldA, fieldB) {
    // Check that two fields agree.
    // 1. No conflicting $w subfields
    const wValuesA = getRelevantSubfieldWValues(fieldA);
    if (wValuesA.length === 0) {
      return true;
    }
    const wValuesB = getRelevantSubfieldWValues(fieldB);
    if (wValuesB.length === 0) {
      return true;
    }
    nvdebug('LOOK FOR CONFLICT');
    // 2. has conflict
    if (wValuesA.some(valueA => hasConflict(valueA, wValuesB)) || wValuesB.some(valueB => hasConflict(valueB, wValuesA))) {
      nvdebug('FOUND CONFLICT');
      return false;
    }
    nvdebug('NO CONFLICT');
    return true;

    function hasConflict(value, opposingValues) {
      const prefix = stripControlNumberPart(value);
      if (!prefix) {
        return false;
      }
      return opposingValues.every(value2 => {
        // Identical IDs eg. "(FOO)BAR" in both records cause no issue:
        if (value === value2) {
          return false;
        }
        const prefix2 = stripControlNumberPart(value2);
        if (!prefix2 || prefix !== prefix2) {
          return false;
        }
        // prefix === prefix2: getting here means that id's mismatch
        return true;
      });
    }

  }

  function noConflictBetweenSubfields(fieldA, fieldB, subfieldCode) {
    const g1 = getSubfieldValues(fieldA, subfieldCode);
    if (g1.length === 0) {
      return true;
    }
    const g2 = getSubfieldValues(fieldB, subfieldCode);
    if (g2.length === 0) {
      return true;
    }
    if (g1.length !== g2.length) {
      return false;
    }
    return g1.every(value => g2.includes(value)) && g2.every(value => g1.includes(value));
  }


  function noConflictBetweenTwoFields(fieldA, fieldB) {
    // Check that two fields agree.
    // 1. No conflicting $w subfields
    if (!noConflictBetweenWSubfields(fieldA, fieldB)) {
      nvdebug('773$w check failed', debug);
      return false;
    }
    // 2. No conflicting $g subfields
    if (!noConflictBetweenSubfields(fieldA, fieldB, 'g')) {
      nvdebug('773$g check failed', debug);
      return false;
    }
    // 3. No conflicting $q
    if (!noConflictBetweenSubfields(fieldA, fieldB, 'q')) {
      nvdebug('773$q check failed', debug);
      return false;
    }
    nvdebug(`773OK: '${fieldToString(fieldA)}' vs '${fieldToString(fieldB)}'`, debug);
    return true;

  }

  function noConflicts(field, opposingFields) {
    // Check that no opposing field causes trouble:
    nvdebug('noConflicts() in...', debug);
    return opposingFields.every(otherField => noConflictBetweenTwoFields(field, otherField));
  }
}

export function compare773(recordValuesA, recordValuesB) {
  // NB! Melinda's record control number prefix has been normalized to (FI-MELINDA) (Oops, I've forgotten where that happened...)
  const melindaIdRegexp = /^\(FI-MELINDA\)[0-9]{9}$/u;

  const f773sA = recordValuesA['773']
    .filter(field => melindaIdRegexp.test(field.recordControlNumber))
    .map(field => ({
      'enumerationAndFirstPage': field.enumerationAndFirstPage,
      'recordControlNumber': field.recordControlNumber,
      'relatedParts': field.relatedParts
    }));
  const f773sB = recordValuesB['773']
    .filter(field => melindaIdRegexp.test(field.recordControlNumber))
    .map(field => ({
      'enumerationAndFirstPage': field.enumerationAndFirstPage,
      'recordControlNumber': field.recordControlNumber,
      'relatedParts': field.relatedParts
    }));
  debug('Collected f773s: %o vs %o', f773sA, f773sB);

  // filter sames out!
  const collectedUniqsA = collectUnique773s(f773sA, f773sB);
  const collectedUniqsB = collectUnique773s(f773sB, f773sA);
  debug('Collected f773s: %o vs %o', collectedUniqsA, collectedUniqsB);

  if (collectedUniqsA.length === 0 && collectedUniqsB.length === 0) {
    debug('All 773 fields are equal. Returning true');
    return true;
  }

  if (collectedUniqsA.length > 0 && f773sB.length === 0) {
    debug('A has unique 773s and B empty');
    return 'A';
  }

  if (collectedUniqsB.length > 0 && f773sA.length === 0) {
    debug('B has unique 773s and A empty');
    return 'B';
  }

  // Hard failure if there are 773 $w subfields that have a Melinda-ID, but none of them match between records
  if (collectedUniqsA.length === f773sA.length) {
    debug('Both have unique 773 fields but non matching');

    return false;
  }

  return false;

  function collectUnique773s(fieldArrayA, fieldArrayB) {
    return fieldArrayA.filter(fieldA => !fieldArrayB.some(fieldB => {
      // $w subfields must agree:
      const recordControlNumber = fieldA.recordControlNumber === fieldB.recordControlNumber;
      // $g and $q are optional:
      const relatedParts = fieldA.relatedParts === fieldB.relatedParts || !fieldA.relatedParts || !fieldB.relatedParts;
      const enumerationAndFirstPage = fieldA.enumerationAndFirstPage === fieldB.enumerationAndFirstPage || !fieldA.enumerationAndFirstPage || !fieldB.enumerationAndFirstPage;
      return enumerationAndFirstPage && recordControlNumber && relatedParts;
    }));
  }
}
