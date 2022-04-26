import moment from 'moment';
import {hasFields} from './collectFunctions/collectUtils';
import createDebugLogger from 'debug';


const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:CAT');

export function getCAT(record) {
  // if not fields []
  const CATs = hasFields('CAT', record, catToJSON);
  const [latest, ...otherCats] = CATs.reverse(); // eslint-disable-line functional/immutable-data

  if (latest === undefined) {
    return {latest: {cataloger: 'undefined', time: 'undefined'}, otherCats: [], noCats: true};
  }

  debug('Latest CAT: %o', latest);
  debug('Other CATs: %o', otherCats);

  return {latest, otherCats};

  function catToJSON(cat) {
    const [catalogerSubfield] = cat.subfields.filter(sub => sub.code === 'a').map(sub => sub.value);
    const cataloger = catalogerSubfield === undefined ? 'undefined' : catalogerSubfield;
    const catDate = cat.subfields.filter(sub => sub.code === 'c').map(sub => sub.value);
    const catClock = cat.subfields.filter(sub => sub.code === 'h').map(sub => sub.value);
    const time = moment(catDate + catClock, ['YYYYMMDDHHmm'], true).format('YYYY-MM-DDTHH:mm:ss');

    return {cataloger, time};
  }
}

export function compareCAT(recordValuesA, recordValuesB) {
  const CATsA = recordValuesA.CAT;
  const CATsB = recordValuesB.CAT;

  return innerCompareCat(CATsA, CATsB);
}

// eslint-disable-next-line complexity, max-statements
function innerCompareCat(CATsA, CATsB) {

  debug('Comparing CATs: A: %o vs B: %o', CATsA, CATsB);

  // No need for analysing CATs if neither of records has CATs
  if (CATsA.noCats && CATsB.noCats) {
    return true;
  }

  // The latest CAT is same -> merging ok, no preference
  const hasSameLatestCAT = CATsA.latest.cataloger === CATsB.latest.cataloger && CATsA.latest.time === CATsB.latest.time;
  debug('Has same latest CAT: %o', hasSameLatestCAT);

  if (hasSameLatestCAT) {
    return true;
  }

  debug(`-- Comparing AtoB`);
  const resultA = analyzeCATs(CATsA, CATsB);
  debug(`-- Comparing BtoA`);
  const resultB = analyzeCATs(CATsB, CATsA);

  // Preference for record that has extra CATs after common CAT history
  if (resultA.isAheadOfOther && !resultB.isAheadOfOther) {
    return 'A';
  }
  if (!resultA.isAheadOfOther && resultB.isAheadOfOther) {
    return 'B';
  }

  // If other record has no CATs, preference for record that has non-automatic CATs
  if (CATsA.noCats && resultB.nonCompCats.length > 0) {
    return 'B';
  }
  if (CATsB.noCats && resultA.nonCompCats.length > 0) {
    return 'A';
  }

  // There is a common CAT somewhere in history
  if (resultA.commonOtherCats.length > 0) {

    // Preference for record that has extra CATs after common CAT
    if (resultB.updatesAfterCommonCAT.length === 0 && resultA.updatesAfterCommonCAT.length > 0) {
      return 'A';
    }
    if (resultA.updatesAfterCommonCAT.length === 0 && resultB.updatesAfterCommonCAT.length > 0) {
      return 'B';
    }

    // Preference for record that has non-automatic CATs
    if (resultA.nonCompCats.length > 0 && resultB.nonCompCats.length === 0) {
      return 'A';
    }
    if (resultB.nonCompCats.length > 0 && resultA.nonCompCats.length === 0) {
      return 'B';
    }

    // Both have X amount of uniq updates after common
    return true; // CAT-comparison is for preference only
  }

  return true; // CAT-comparison is for preference only


  function analyzeCATs(CATsCompareTo, CATsToCompare) {
    // Look for identical CATs:
    const isAheadOfOther = compareIfArrayContainsCat(CATsToCompare.latest, CATsCompareTo.otherCats);
    debug('Is ahead of the other: %o', isAheadOfOther);

    const commonOtherCats = CATsCompareTo.otherCats.filter(cat => compareIfArrayContainsCat(cat, CATsToCompare.otherCats));
    debug('Contains common CATs: %o', commonOtherCats);

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
    return [latest, ...otherCats].filter(cat => cat.cataloger !== undefined && !(/^LOAD-\w*|^IMP-\w*|^CONV-\w*|^REM-\w*|^undefined$/u).test(cat.cataloger));
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

export function checkCAT(record1, record2) {
  const data1 = getCAT(record1);
  const data2 = getCAT(record2);

  return innerCompareCat(data1, data2);
}

