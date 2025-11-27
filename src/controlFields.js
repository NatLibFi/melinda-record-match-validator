import createDebugLogger from 'debug';
import moment from 'moment';
import {compareValueContent} from './compareFunctions/compareUtils.js';
import {get005, get008} from './collectFunctions/collectControlFields.js';
import {nvdebug} from './utils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:controlFields');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');


// Compare

export function compare001(recordValuesA, recordValuesB) {
  const f001A = recordValuesA['001'];
  const f001B = recordValuesB['001'];

  return {
    'value': compareValueContent(f001A.value, f001B.value),
    'isMelindaId': compareIsMelindaId()
  };

  function compareIsMelindaId() {
    debugDev('%o vs %o', f001A, f001B);
    if (f001A.isMelindaId && f001B.isMelindaId) {
      debugDev('Both are Melinda ids');
      return true;
    }

    if (f001A.isMelindaId && !f001B.isMelindaId) {
      debugDev('Only A is Melinda id');
      return 'A';
    }

    if (!f001A.isMelindaId && f001B.isMelindaId) {
      debugDev('Only B is Melinda id');
      return 'B';
    }

    debugDev('Both are non Melinda ids');
    return false;
  }
}

export function compare005(recordValuesA, recordValuesB) {
  const f005A = recordValuesA['005'];
  const f005B = recordValuesB['005'];

  return ratef005();

  function ratef005() {
    debugDev('%o vs %o', f005A, f005B);
    if (moment(f005A).isSame(f005B)) {
      debugDev('Both have same last modified time');
      return true;
    }

    if (moment(f005A).isAfter(f005B)) {
      debugDev('A has been modified more recently');
      return 'A';
    }

    debugDev('B has been modified more recently');
    return 'B';
  }
}

/*
export function compare008(recordValuesA, recordValuesB) {
  const f008A = recordValuesA['008'];
  const f008B = recordValuesB['008'];
  return innerCompare008(f008A, f008B);
}
*/

// DEVELOP: we do do any comparison based on 008/39 here - is cataloguingSource used in some other comparison task?
function innerCompare008(f008A, f008B) {
  nvdebug(`A 008: ${JSON.stringify(f008A)}`);
  nvdebug(`B 008: ${JSON.stringify(f008B)}`);

  if (!isPairableFormOfItem(f008A.formOfItem.code, f008B.formOfItem.code)) {
    return false;
  }

  const mp06Result = mp06Comparison(f008A.publicationStatus.code, f008B.publicationStatus.code);

  if (mp06Result !== true) {
    return mp06Result;
  }

  return true;

  function isPairableFormOfItem(formOfItemA, formOfItemB) {
    // Prevent online and (local) direct electronic resources from merging:
    // (There are other conflincting values as well, but this is the case I se most likely to cause merges that should not happen.)
    if (formOfItemA === 'o' && formOfItemB === 'q') {
      return false;
    }
    if (formOfItemA === 'q' && formOfItemB === 'o') {
      return false;
    }
    return true;
  }

  function mp06Comparison(mp06A, mp06B) {
    if (mp06A === mp06B) {
      return true;
    }
    // 'b' (before Christ) is always wrong in our domain
    if (mp06A === 'b') {
      return 'B';
    }
    if (mp06B === 'b') {
      return 'A';
    }
    // After handling 'b', '|' is the ultimate loser:
    if (mp06A === '|') {
      return 'B';
    }
    if (mp06B === '|') {
      return 'A';
    }


    // d < (c or u) < |
    const continuingResource = compareContinuingResources(mp06A, mp06B);
    if (continuingResource !== false) {
      return continuingResource;
    }

    // One is a reprint and the other one is not. Abort!
    /*
    if (mp06A === 'r' || mp06B === 'r') {
      return false;
    }
    */

    const scoreA = scoreSinglePart(mp06A);
    const scoreB = scoreSinglePart(mp06B);

    if (scoreA > -1 && scoreB > -1) {
      if (scoreA > scoreB) {
        return 'A';
      }
      if (scoreA < scoreB) {
        return 'B';
      }
    }

    // Other rules?
    return true;
  }

  function isUnknownOrContinuingResource(mp06) {
    return ['|', 'c', 'd', 'u'].includes(mp06);
  }

  function compareContinuingResources(mp06A, mp06B) {
    // There should not be pairs here
    if (!isUnknownOrContinuingResource(mp06A) || !isUnknownOrContinuingResource(mp06B)) {
      return false;
    }
    // d < c or u < |
    if (mp06A === 'd' || mp06B === '|') {
      return 'A';
    }
    if (mp06B === 'd' || mp06A === '|') {
      return 'B';
    }
    // One is 'c' and the other one is 'u'. I'm not sure is one better than the other...
    return true;
  }

}

function scoreSinglePart(mp06) {
  if (mp06 === 'e' || mp06 === 'r' || mp06 === 't') { // single date
    return 4;
  }
  if (mp06 === 'p' || mp06 === 's') { // single date
    return 3;
  }
  if (mp06 === 'q') { // questionable date
    return 2;
  }
  if (mp06 === 'n') { // unknown date
    return 1;
  }
  return -1;
}
// check (collect&compare):

export function check005({record1, record2}) {
  const data1 = get005(record1);
  const data2 = get005(record2);

  // Theoretically the record with newer timestamp is the better one.
  // However, we have n+1 load-fixes etc reasons why this is not reliable, so year is good enough for me.
  const val1 = getYear(data1);
  const val2 = getYear(data2);
  if (val1 > val2) {
    return 'A';
  }
  if (val2 > val1) {
    return 'B';
  }
  return true;

  function getYear(value) {
    return parseInt(value.substr(0, 4), 10); // YYYY is approximate enough
  }
}

export function check008({record1, record2}) {
  //nvdebug(`CHECK 008`);
  const data1 = get008(record1);
  const data2 = get008(record2);
  return innerCompare008(data1, data2);
}
