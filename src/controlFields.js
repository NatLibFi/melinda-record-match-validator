import createDebugLogger from 'debug';
import moment from 'moment';
import {compareValueContent} from './compareFunctions/compareUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:controlFields');


// Collect:

export function get001(record) {

  const [f001Value] = record.get('001').map(field => field.value);
  const [f003Value] = record.get('003').map(field => field.value);

  const isMelindaId = f003Value === 'FI-MELINDA';
  debug('Record f001 value: %o', f001Value);
  debug('Record f001 value is melinda id: %o', isMelindaId);

  return {value: f001Value, isMelindaId};
}

export function get005(record) {
  const [f005Value] = record.get('005').map(field => field.value);

  const time = moment(f005Value, ['YYYYMMDDHHmmss.S'], true).format();
  debug('Last modification time: %o', time);

  return time;
}

export function get008(record) {
  const [f008Value] = record.get('008').map(field => field.value);

  return f008Value;
}
// Compare

export function compare001(recordValuesA, recordValuesB) {
  const f001A = recordValuesA['001'];
  const f001B = recordValuesB['001'];

  return {
    'value': compareValueContent(f001A.value, f001B.value),
    'isMelindaId': compareIsMelindaId()
  };

  function compareIsMelindaId() {
    debug('%o vs %o', f001A, f001B);
    if (f001A.isMelindaId && f001B.isMelindaId) {
      debug('Both are Melinda ids');
      return true;
    }

    if (f001A.isMelindaId && !f001B.isMelindaId) {
      debug('Only A is Melinda id');
      return 'A';
    }

    if (!f001A.isMelindaId && f001B.isMelindaId) {
      debug('Only B is Melinda id');
      return 'B';
    }

    debug('Both are non Melinda ids');
    return false;
  }
}

export function compare005(recordValuesA, recordValuesB) {
  const f005A = recordValuesA['005'];
  const f005B = recordValuesB['005'];

  return ratef005();

  function ratef005() {
    debug('%o vs %o', f005A, f005B);
    if (moment(f005A).isSame(f005B)) {
      debug('Both have same last modified time');
      return true;
    }

    if (moment(f005A).isAfter(f005B)) {
      debug('A has been modified more recently');
      return 'A';
    }

    debug('B has been modified more recently');
    return 'B';
  }
}

export function compare008(recordValuesA, recordValuesB) {
  const f008A = recordValuesA['008'];
  const f008B = recordValuesB['008'];
  return innerCompare008(f008A, f008B);
}

function innerCompare008(f008A, f008B) {
  const goodA = valid008(f008A);
  const goodB = valid008(f008B);
  if (!goodA) {
    if (!goodB) {
      return f008A === f008B; // If it is same shit, I'll let it pass
    }
    return 'B';
  }
  if (!goodB) {
    return 'A';
  }

  return mp06(f008A, f008B);

  function mp06(a, b) {
    const mp06A = a.charAt(6);
    const mp06B = b.charAt(6);
    if (mp06A === mp06B) {
      return true;
    }
    // One is a reprint and the other one is not. Abort!
    if (mp06A === 'r' || mp06B === 'r') {
      return false;
    }
    // d < c or u < |
    const continuingResource = compareContinuingResources(mp06A, mp06B);
    if (continuingResource !== false) {
      return continuingResource;
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

  function valid008(f008) {
    if (!f008 || f008.length !== 40) {
      return false;
    }
    return true;
  }
}

// check (collect&compare):

export function check005(record1, record2) {
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

export function check008(record1, record2) {
  const data1 = get008(record1);
  const data2 = get008(record2);
  return innerCompare008(data1, data2);
}
