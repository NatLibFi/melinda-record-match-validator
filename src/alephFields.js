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
import {getSubfieldValue} from './collectFunctions/collectUtils';
import {fieldHasSubfield} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:alephFunctions');

function nvdebug(message) {
  debug(message);
  console.info(message); // eslint-disable-line no-console
}

export function checkLOW(record1, record2) {
  const score1 = lowFieldsToScore(record1.get('LOW'));
  const score2 = lowFieldsToScore(record2.get('LOW'));
  nvdebug(`LOW scores: ${score1} vs ${score2}`);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }
  return true;

  function lowFieldsToScore(fields) {
    // min=0, max=100
    if (fields.length === 0) {
      // Having no LOW fields is pretty suspicious
      return 0;
    }

    return Math.max(...fields.map(field => scoreField(field)));
  }

  function scoreField(field) {
    const value = getSubfieldValue(field, 'a');
    // Corrupted field
    if (!value) {
      return 0;
    }
    if (value === 'FIKKA') {
      return 100;
    }
    // If we'd want to, we could add some kind of priority based on organizations.
    // However, we wouldn't be making friends there: If X > Y, then Y might hurt his feelings.
    return 50;
  }
}


export function checkSID(record1, record2) {
  const fields1 = record1.get('SID');
  const fields2 = record2.get('SID');
  // array.some(...) returns false on empty arrays... Handle them first:
  if (fields1.length === 0 || fields2.length === 0) {
    // NB! JO has preference rules as well. I don't think they are meaningful...
    return true;
  }

  // SID's $b subfield contains information about the owning organization.
  if (!fields1.some(field => isMergableSID(field, fields2)) || !fields2.some(field => isMergableSID(field, fields1))) {
    return false;
  }
  return true;

  function isMergableSID(sidField, otherSidFields) {
    const subfieldBValue = getSubfieldValue(sidField, 'b');
    const subfieldCValue = getSubfieldValue(sidField, 'c');
    if (!subfieldBValue || !subfieldCValue) { // Data corruption
      return false;
    }

    const counterpartFields = otherSidFields.filter(otherField => fieldHasSubfield(otherField, 'b', subfieldBValue));
    if (counterpartFields.length === 0) { // The other record has not relevant SIDs, which is fine.
      return true;
    }
    if (counterpartFields.length > 1) { // This is mainly a sanity check
      return false;
    }
    return subfieldCValue === getSubfieldValue(counterpartFields[0], 'c');
  }
}

