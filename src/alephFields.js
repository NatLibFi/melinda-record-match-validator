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
import {getSubfieldValue, hasFields} from './collectFunctions/collectUtils';
import {nvdebug} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:alephFunctions');

// Collect SID
export function getSID(record) {
  const SIDs = hasFields('SID', record).map(field => sidToJson(field));
  debug('SIDs: %o', SIDs);

  return SIDs;

  function sidToJson(sid) {
    const [database] = sid.subfields.filter(sub => sub.code === 'b').map(sub => sub.value);
    const [id] = sid.subfields.filter(sub => sub.code === 'c').map(sub => sub.value);

    return {id, database};
  }
}

// Compare SID


export function compareSID(recordValuesA, recordValuesB) {
  const SIDsA = recordValuesA.SID;
  const SIDsB = recordValuesB.SID;
  return compareSIDValues(SIDsA, SIDsB);
}

function compareSIDValues(SIDsA, SIDsB) {
  debug('A: %o vs B: %o', SIDsA, SIDsB);

  return compareSIDContent();

  function compareSIDContent() {
    if (JSON.stringify(SIDsA) === JSON.stringify(SIDsB)) {
      debug('SIDs A and B are same');
      return true;
    }

    if (SIDsB.length === 0) {
      if (SIDsA.length > 0) {
        debug('SIDs A contains values and B is empty');
        return 'A';
      }
      debug('Both SIDS are empty');
      return 'A';
    }

    if (SIDsA.length === 0) {
      debug('SIDs B contains values and A is empty');
      return 'B';
    }

    // Same database & different id => HARD failure
    if (SIDsA.some(sidA => SIDsB.some(sidB => sidA.database === sidB.database && sidA.id !== sidB.id))) {
      debug('SIDs: same db but diffent ids: fail');
      return false;
    }

    const onlyA = SIDsA.filter(SIDA => SIDsB.every(SIDB => SIDA.database !== SIDB.database));
    const onlyB = SIDsB.filter(SIDB => SIDsA.every(SIDA => SIDA.database !== SIDB.database));

    // It's union: same result both ways... And anyway we are interested in the different values, not the same ones.
    //const SIDsBContainsFromA = SIDsA.filter(SIDA => SIDsB.some(SIDB => SIDA.database === SIDB.database && SIDA.id === SIDB.id));
    //const SIDsAContainsFromB = SIDsB.filter(SIDB => SIDsA.some(SIDA => SIDA.database === SIDB.database && SIDA.id === SIDB.id));

    if (onlyA.length > 0 && onlyB.length === 0) {
      debug('SIDs A contains all values from B');
      return 'A';
    }

    if (onlyB.length > 0 && onlyA.length === 0) {
      debug('SIDs B contains all values from A');
      return 'B';
    }

    return true;
  }
}

export function checkSID(record1, record2) {
  const fields1 = getSID(record1);
  const fields2 = getSID(record2);
  return compareSIDValues(fields1, fields2);

  /*
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


    const counterpartFields = otherSidFields.filter(otherField => fieldHasSubfield(otherField, 'b', subfieldBValue));
    if (counterpartFields.length === 0) { // The other record has not relevant SIDs, which is fine.
      return true;
    }
    if (counterpartFields.length > 1) { // This is mainly a sanity check
      return false;
    }
    return subfieldCValue === getSubfieldValue(counterpartFields[0], 'c');
  }
  */
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


