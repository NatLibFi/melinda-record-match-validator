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
    if (resultB.updatesAfterCommonCAT.length === 0 && resultA.updatesAfterCommonCAT.length > 0) {
      return 'A';
    }

    if (resultA.updatesAfterCommonCAT.length === 0 && resultB.updatesAfterCommonCAT.length > 0) {
      return 'B';
    }

    if (resultA.nonCompCats.length > 0 && resultB.nonCompCats.length === 0) {
      return 'A';
    }

    if (resultB.nonCompCats.length > 0 && resultA.nonCompCats.length === 0) {
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

    const nonCompCats = catsContainNonImpOrLoad(CATsCompareTo.latest, CATsCompareTo.otherCats);
    debug('CATs contains NON "IMP-" or "LOAD-" or "CONV-" CATs: %o', nonCompCats);

    return {
      isAheadOfOther,
      commonOtherCats,
      updatesAfterCommonCAT,
      nonCompCats
    };
  }

  function catsContainNonImpOrLoad(latest, otherCats) {
    return [latest, ...otherCats].filter(cat => cat.cataloger !== undefined && !(/^LOAD-\w*|^IMP-\w*|^CONV-\w*|^REM-\w*/u).test(cat.cataloger));
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


