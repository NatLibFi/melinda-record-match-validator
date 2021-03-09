import createDebugLogger from 'debug';
import moment from 'moment';
import {compareValueContent} from './compareUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:controlFields');

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
