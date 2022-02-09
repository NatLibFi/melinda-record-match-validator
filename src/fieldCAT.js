import createDebugLogger from 'debug';
import moment from 'moment';
import {hasFields} from './collectUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:alephInternalFields');

export function getCAT(record) {
  // if not fields []
  const CATs = hasFields('CAT', record, catToJSON);
  const [latest, ...otherCats] = CATs.reverse(); // eslint-disable-line functional/immutable-data

  if (latest === undefined) {
    return {latest: {cataloger: 'undefined', time: 'undefined'}, otherCats: []};
  }

  debug('Latest CAT: %o', latest);
  debug('Other CATs: %o', otherCats);

  return {latest, otherCats};

  function catToJSON(cat) {
    const [catalogerSubfield] = cat.subfields.filter(sub => sub.code === 'a').map(sub => sub.value);
    const cataloger = catalogerSubfield === undefined ? 'undefined' : catalogerSubfield;
    const catDate = cat.subfields.filter(sub => sub.code === 'c').map(sub => sub.value);
    const catClock = cat.subfields.filter(sub => sub.code === 'h').map(sub => sub.value);
    const time = moment(catDate + catClock, ['YYYYMMDDHHmm'], true).format();

    return {cataloger, time};
  }
}

