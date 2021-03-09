import createDebugLogger from 'debug';
import moment from 'moment';
import {hasFields, getSubfield} from './collectUtils';

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

export function getLOW(record) {
  const LOWs = hasFields('LOW', record, getSubfield, 'a');
  debug('LOWs: %o', LOWs);

  return LOWs;
}

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
