
import createDebugLogger from 'debug';
import {getSID} from '../collectFunctions/collectUtils.js';
//import {nvdebug} from './utils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectFunctions/collectFieldSID');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');


// Compare SID


export function compareSID(recordValuesA, recordValuesB) {
  const SIDsA = recordValuesA.SID;
  const SIDsB = recordValuesB.SID;
  return compareSIDValues(SIDsA, SIDsB);
}

function compareSIDValues(SIDsA, SIDsB) {
  debugDev('A: %o vs B: %o', SIDsA, SIDsB);

  return compareSIDContent();

  function compareSIDContent() {
    if (SIDsB.length === 0) {
      if (SIDsA.length > 0) {
        debugDev('SIDs A contains values and B is empty');
        return 'A';
      }
      debugDev('Both SIDS are empty');
      return true;
    }

    if (SIDsA.length === 0) {
      debugDev('SIDs B contains values and A is empty');
      return 'B';
    }

    // Same database & different id => HARD failure
    if (SIDsA.some(sidA => SIDsB.some(sidB => sidA.database === sidB.database && sidA.id !== sidB.id))) {
      debugDev('SIDs: same db but diffent ids: fail');
      return false;
    }

    const onlyA = SIDsA.filter(SIDA => SIDsB.every(SIDB => SIDA.database !== SIDB.database));
    const onlyB = SIDsB.filter(SIDB => SIDsA.every(SIDA => SIDA.database !== SIDB.database));
    if (onlyA.length === 0 && onlyB.length === 0) {
      debugDev('SIDs A and B are same');
      return true;
    }
    // It's union: same result both ways... And anyway we are interested in the different values, not the same ones.
    //const SIDsBContainsFromA = SIDsA.filter(SIDA => SIDsB.some(SIDB => SIDA.database === SIDB.database && SIDA.id === SIDB.id));
    //const SIDsAContainsFromB = SIDsB.filter(SIDB => SIDsA.some(SIDA => SIDA.database === SIDB.database && SIDA.id === SIDB.id));

    if (onlyA.length > 0 && onlyB.length === 0) {
      debugDev('SIDs A contains all values from B');
      return 'A';
    }

    if (onlyB.length > 0 && onlyA.length === 0) {
      debugDev('SIDs B contains all values from A');
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


