import createDebugLogger from 'debug';
import {compareArrayContent} from './compareUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:alephInternalFields');

export function compareCAT(recordValuesA, recordValuesB) {
  const CATsA = recordValuesA.CAT;
  const CATsB = recordValuesB.CAT;
  debug('A: %o vs B: %o', CATsA, CATsB);

  const hasSameLatestCAT = CATsA.latest.cataloger === CATsB.latest.cataloger && CATsA.latest.time === CATsB.latest.time;
  debug('Has same latest CAT: %o', hasSameLatestCAT);

  if (hasSameLatestCAT) {
    return true;
  }

  const resultA = analyzeCATs(CATsA, CATsB);
  const resultB = analyzeCATs(CATsB, CATsA);

  if (resultA.isAheadOfOther && !resultB.isAheadOfOther) {
    return 'A';
  }

  if (!resultA.isAheadOfOther && resultB.isAheadOfOther) {
    return 'B';
  }

  if (resultA.commonOtherCats.length > 0) {
    if (resultB.updatesAfterCommonCAT === 0 && resultA.updatesAfterCommonCAT > 0) {
      return 'A';
    }

    if (resultA.updatesAfterCommonCAT === 0 && resultB.updatesAfterCommonCAT > 0) {
      return 'B';
    }

    // Both have X amount of uniq updates after common
    return false;
  }

  return false;

  function analyzeCATs(CATsCompareTo, CATsToCompare) {
    const isAheadOfOther = compareIfArrayContainsCat(CATsToCompare.latest, CATsCompareTo.otherCats);
    debug('Is ahead of the other: %o', isAheadOfOther);

    const commonOtherCats = CATsCompareTo.otherCats.filter(cat => compareIfArrayContainsCat(cat, CATsToCompare.otherCats));
    debug('Containt common CATs: %o', commonOtherCats);

    const updatesAfterCommonCAT = CATsCompareTo.otherCats.indexOf(commonOtherCats[0]);
    debug('Contains %o CATs after common CAT', updatesAfterCommonCAT);

    const nonImpOrLoadCats = catsContainNonImpOrLoad(CATsA.latest, CATsA.otherCats);
    debug('CATs contains NON "IMP-" or "LOAD-" or "CONV-" CATs: %o', nonImpOrLoadCats);

    return {
      isAheadOfOther,
      commonOtherCats,
      updatesAfterCommonCAT,
      nonImpOrLoadCats
    };
  }

  function catsContainNonImpOrLoad(latest, otherCats) {
    return [latest, ...otherCats].filter(cat => cat.cataloger !== undefined && !(/^LOAD-\w*|^IMP-\w*|^CONV-\w*/u).test(cat.cataloger));
  }

  function compareIfArrayContainsCat(catToCompare, catArray) {
    return catArray.some(cat => {
      if (cat.cataloger === null || catToCompare.cataloger === null) {
        return false;
      }

      return catToCompare.cataloger === cat.cataloger && catToCompare.time === cat.time;
    });
  }
}

export function compareLOW(recordValuesA, recordValuesB) {
  const LOWsA = recordValuesA.LOW;
  const LOWsB = recordValuesB.LOW;
  debug('A: %o vs B: %o', LOWsA, LOWsB);

  return compareArrayContent(LOWsA, LOWsB, true);
}

export function compareSID(recordValuesA, recordValuesB) {
  const SIDsA = recordValuesA.SID;
  const SIDsB = recordValuesB.SID;
  debug('A: %o vs B: %o', SIDsA, SIDsB);

  return compareSIDContent();

  function compareSIDContent() {
    if (JSON.stringify(SIDsA) === JSON.stringify(SIDsB)) {
      debug('SIDs A and B are same');
      return true;
    }

    const SIDsBContainsFromA = SIDsA.filter(SIDA => SIDsB.some(SIDB => SIDA.database === SIDB.database && SIDA.id === SIDB.id));
    const SIDsAContainsFromB = SIDsB.filter(SIDB => SIDsA.some(SIDA => SIDA.database === SIDB.database && SIDA.id === SIDB.id));

    if (SIDsA.length > 0 && SIDsB === 0) {
      debug('SIDs A contains values and B is empty');
      return 'A';
    }

    if (SIDsB.length > 0 && SIDsA === 0) {
      debug('SIDs B contains values and A is empty');
      return 'A';
    }

    if (SIDsB.length > 0 && JSON.stringify(SIDsAContainsFromB) === JSON.stringify(SIDsB)) {
      debug('SIDs A contains all values from B');
      return 'A';
    }

    if (SIDsA.length > 0 && JSON.stringify(SIDsBContainsFromA) === JSON.stringify(SIDsA)) {
      debug('SIDs B contains all values from A');
      return 'B';
    }

    debug('SIDs A or B does not contain all values from other');
    return false;
  }
}
