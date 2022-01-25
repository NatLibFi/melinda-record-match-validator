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
import {fieldToString, sameControlNumberIdentifier} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field773');

function nvdebug(message) {
  debug(message);
  console.info(message); // eslint-disable-line no-console
}

function getMelindaDefaultPrefix() {
  return '(FI-MELINDA)';
}

function normalize773w(value) {
  // NB! melindaPrefix is referred to in compareFunctions/fields.js!
  // We should configure this somewhere on a lower level.
  const melindaPrefix = getMelindaDefaultPrefix();
  if ((/^FCC[0-9]{9}$/u).test(value)) {
    return `${melindaPrefix}${value.substring(3)}`;
  }
  if ((/^\(FIN01\)[0-9]{9}$/u).test(value)) {
    return `${melindaPrefix}${value.substring(7)}`;
  }
  if ((/^\(FI-MELINDA\)[0-9]{9}$/u).test(value)) {
    return `${melindaPrefix}${value.substring(12)}`;
  }

  return value;
}

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
      .map(value => normalize773w(value))
      .filter(value => value.startsWith(getMelindaDefaultPrefix()));
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
    return getSubfieldValues(field, 'w')
      .map(value => normalize773w(value))
    // Split value to two parts: id (nine last digits) and prefix (= "everything but id"),
    // then check that our prefix == melinda's prefix, and that id looks like a melinda ID:
      .filter(value => value.slice(0, -9) === getMelindaDefaultPrefix() && (/^[0-9]{9}$/u).test(value.slice(-9)));
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
    // 2. has conflict
    if (wValuesA.some(valueA => hasConflict(valueA, wValuesB)) || wValuesB.some(valueB => hasConflict(valueB, wValuesA))) {
      return false;
    }
    return true;

    function hasConflict(value, opposingValues) {
      return opposingValues.every(value2 => {
        // Identical IDs eg. "(FOO)BAR" in both records cause no issue:
        if (value === value2) {
          return false;
        }
        // However "(FOO)LORUM" and "(FOO)IPSUM" signal troubles.
        // (Theoretically LORUM might refer to a deleted record that has been replaced by/merged to IPSUM.)
        if (sameControlNumberIdentifier(value, value2)) {
          return true;
        }
        return false;
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
      nvdebug('773$w check failed');
      return false;
    }
    // 2. No conflicting $g subfields
    if (!noConflictBetweenSubfields(fieldA, fieldB, 'g')) {
      nvdebug('773$g check failed');
      return false;
    }
    // 3. No conflicting $q
    if (!noConflictBetweenSubfields(fieldA, fieldB, 'q')) {
      nvdebug('773$q check failed');
      return false;
    }
    nvdebug(`773OK: '${fieldToString(fieldA)}' vs '${fieldToString(fieldB)}'`);
    return true;

  }

  function noConflicts(field, opposingFields) {
    // Check that no opposing field causes trouble:
    nvdebug('noConflicts() in...');
    return opposingFields.every(otherField => noConflictBetweenTwoFields(field, otherField));
  }
}

export function compare773(recordValuesA, recordValuesB) {
  // NB! Melinda's record control number prefix has been normalized to (FI-MELINDA)
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
