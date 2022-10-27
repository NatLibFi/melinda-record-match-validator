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
import {hasFields} from './collectFunctions/collectUtils';
//import {nvdebug} from './utils';

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

  // eslint-disable-next-line max-statements
  function compareSIDContent() {
    if (SIDsB.length === 0) {
      if (SIDsA.length > 0) {
        debug('SIDs A contains values and B is empty');
        return 'A';
      }
      debug('Both SIDS are empty');
      return true;
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
    if (onlyA.length === 0 && onlyB.length === 0) {
      debug('SIDs A and B are same');
      return true;
    }
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

    return true; // default to true
  }
}

export function checkSID({record1, record2}) {
  const fields1 = getSID(record1);
  const fields2 = getSID(record2);
  return compareSIDValues(fields1, fields2);

}


