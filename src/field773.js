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
import {hasIdMismatch, normalizeMelindaId, nvdebug} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field773');

function getX73(record, paramTag) {
  // Tag should be 773 or 973. Add sanity check?
  const F773s = hasFields(paramTag, record, f773ToJSON);
  debug('Field %ss: %o', paramTag, F773s);

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
    // Get normalized subfields:
    const wSubfields = getSubfieldValues(field, 'w')
      .map(value => normalizeMelindaId(value)) // normalize, though filter would succeed anyway
      .filter(value => !(/^[0-9]+$/u).test(value)); // Filter digit-only values away
    if (wSubfields.length > 0) {
      return wSubfields;
    }
    return getDefaultMissValue();
  }
}

export function get773(record) { // collect
  const f773 = getX73(record, '773');
  const f973 = getX73(record, '973');
  return [...f773, ...f973];
}

export function check773(record1, record2) {
  const data1 = get773(record1);
  const data2 = get773(record2);
  return compare773values(data1, data2);
}

function compare773values(f773sA, f773sB) {

  debug('Collected f773s: %o vs %o', f773sA, f773sB);
  nvdebug('compare773values() in...');
  nvdebug(JSON.stringify(f773sA), debug);
  nvdebug(JSON.stringify(f773sB), debug);

  // Fail if one of the records has multiple 773/973 fields:
  // (Multiple 773 fields means that it's a Viola record, or that some weeding is need first.)
  if (f773sA.length > 1 || f773sB.length > 1) {
    return false;
  }
  // Fail if one of the fields is 973
  if (f773sA.some(val => val.tag === '973') || f773sB.some(val => val.tag === '973')) {
    return false;
  }

  if (f773sA.length > 0 && f773sB.length === 0) {
    return 'A';
  }

  if (f773sB.length > 0 && f773sA.length === 0) {
    return 'B';
  }

  if (f773sA.length === 0 && f773sB.length === 0) {
    return true;
  }

  const undefinedHack = getDefaultMissValue(); // String 'undefined'

  return innerCompare(f773sA[0], f773sB[0]);

  function noMultivals(val1, val2) {
    nvdebug(`compare '${val1}' vs '${val2}' (default: '${undefinedHack}')`, debug);
    return val1 === val2 || !val1 || !val2 || val1 === undefinedHack || val2 === undefinedHack;
  }

  function acceptControlNumbers(nums1, nums2) {
    return !(nums1.some(val => hasIdMismatch(val, nums2)) || nums2.some(val2 => hasIdMismatch(val2, nums1)));
  }

  function innerCompare(data1, data2) {
    const recordControlNumbers = acceptControlNumbers(data1.recordControlNumbers, data2.recordControlNumbers);
    nvdebug(`RCN ${recordControlNumbers}`, debug);
    // $g and $q are optional:
    const relatedParts = noMultivals(data1.relatedParts, data2.relatedParts);
    const enumerationAndFirstPage = noMultivals(data1.enumerationAndFirstPage, data2.enumerationAndFirstPage);
    nvdebug(`RCN ${recordControlNumbers}\tRP ${relatedParts ? 'true' : 'false'}\tEAFP ${enumerationAndFirstPage ? 'true' : 'false'}`, debug);
    nvdebug(`SOME RESULT: ${enumerationAndFirstPage && recordControlNumbers && relatedParts ? 'true' : 'false'}`);
    return enumerationAndFirstPage && recordControlNumbers && relatedParts;
  }
}

export function compare773(recordValuesA = [], recordValuesB = []) {
  const f773sA = recordValuesA['773'];
  const f773sB = recordValuesB['773'];
  return compare773values(f773sA, f773sB);
}
