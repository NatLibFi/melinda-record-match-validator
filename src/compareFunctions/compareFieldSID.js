
import createDebugLogger from 'debug';
import {getSID} from '../collectFunctions/collectUtils.js';
//import {nvdebug} from './utils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectFunctions/collectFieldSID');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

// Databases where mismatching SIDs (same database, different id) are tolerated by the special case
const SPECIAL_CASE_DATABASES = ['tati'];
// Databases where the records must share at least one matching SID (same database + same id) for the special case to apply
const SUPPLIER_DATABASES = ['FI-BTJ'];

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

    // Same database & different id => HARD failure, unless the special case applies
    const mismatchingDatabases = SIDsA
      .filter(sidA => SIDsB.some(sidB => sidA.database === sidB.database && sidA.id !== sidB.id))
      .map(sid => sid.database);
    if (mismatchingDatabases.length > 0) {
      // Special case: if the only mismatching SIDs are for libraries in SPECIAL_CASE_DATABASES
      // and the records share at least one matching SID for libraries in SUPPLIER_DATABASES, we accept the match
      const allMismatchedAreSpecialCase = mismatchingDatabases.every(db => SPECIAL_CASE_DATABASES.includes(db));
      const hasMatchingSupplierSID = SIDsA.some(sidA => SIDsB.some(sidB => sidA.database === sidB.database && sidA.id === sidB.id && SUPPLIER_DATABASES.includes(sidA.database)));
      const specialCase = allMismatchedAreSpecialCase && hasMatchingSupplierSID;
      debugDev(`Mismatching SIDs in databases: ${[...new Set(mismatchingDatabases)].join(', ')} - special case applies: ${specialCase}`);

      if (!specialCase) {
        debugDev('SIDs: same db but different ids: fail');
        return false;
      }
      debugDev('SIDs: special case applies, continuing with set comparison');
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


