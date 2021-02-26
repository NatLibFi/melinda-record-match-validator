import createDebugLogger from 'debug';
import moment from 'moment';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:controlFields');

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
