// 041?
// cat
import createDebugLogger from 'debug';
import moment from 'moment';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:fields');

/*
{
  "tag": "CAT",
  "ind1": " ",
  "ind2": " ",
  "subfields": [
    {
      "code": "a",
      "value": "LOAD-YSO"
    }, {
      "code": "b",
      "value": "00"
    }, {
      "code": "c",
      "value": "20190705"
    }, {
      "code": "l",
      "value": "FIN01"
    }, {
      "code": "h",
      "value": "1135"
    }
  ]
}
*/

export function getCAT(record) {

  const [latest, ...otherCats] = record.get('CAT').map(cat => catToJSON(cat)).reverse(); // eslint-disable-line functional/immutable-data

  debug('Latest CAT: %o', latest);
  debug('Other CATs: %o', otherCats);

  return {latest, otherCats};

  function catToJSON(cat) {
    const [cataloger] = cat.subfields.filter(sub => sub.code === 'a').map(sub => sub.value);
    const catDate = cat.subfields.filter(sub => sub.code === 'c').map(sub => sub.value);
    const catClock = cat.subfields.filter(sub => sub.code === 'h').map(sub => sub.value);
    const time = moment(catDate + catClock, ['YYYYMMDDHHmm'], true).format();

    return {cataloger, time};
  }
}
