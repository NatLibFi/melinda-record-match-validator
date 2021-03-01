// 041?
// 042

import createDebugLogger from 'debug';
import moment from 'moment';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:fields');

/*
336, 337, 338
  me haluttaan 336, 337, 338 $b:t - siihen miten ne toimii validoinnissa pitää pistää vähän mietintää.
  (Merge-käyttöliittymä siis herjaa käyttäjälle, että tarkista tilanne jos nää eroaa, automaatiolla pitää miettiä jotain parempaa logiikkaa - mut ainakin me siis tiedetään,
  että tekstiaineistoissa jos toinen tietue on 337 $b c ja toinen on 337 $b n niin yhdistämistä ei saa tehdä. (Tietokonekäyttöinen teksti ja fyysinen teksti)
*/

export function get336bContentType(record) {
  const [contentType] = record.get('336').map(field => {
    const [value] = field.subfields.filter(sub => sub.code === 'b').map(sub => sub.value);
    return value;
  });

  return {contentType};
}

export function get337bMediaType(record) {
  const [mediaType] = record.get('337').map(field => {
    const [value] = field.subfields.filter(sub => sub.code === 'b').map(sub => sub.value);
    return value;
  });

  return {mediaType};
}

export function get338bCarrierType(record) {
  const [carrierType] = record.get('338').map(field => {
    const [value] = field.subfields.filter(sub => sub.code === 'b').map(sub => sub.value);
    return value;
  });

  return {carrierType};
}

export function getCAT(record) {
  const [latest, ...otherCats] = record.get('CAT').map(cat => catToJSON(cat)).reverse(); // eslint-disable-line functional/immutable-data

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
  const LOWs = record.get('LOW').map(field => {
    const [value] = field.subfields.filter(sub => sub.code === 'a').map(sub => sub.value);
    return value;
  });
  return LOWs;
}

export function getSID(record) {
  const SIDs = record.get('SID').map(field => sidToJson(field));
  return SIDs;

  function sidToJson(sid) {
    const [database] = sid.subfields.filter(sub => sub.code === 'b').map(sub => sub.value);
    const [id] = sid.subfields.filter(sub => sub.code === 'c').map(sub => sub.value);

    return {id, database};
  }
}
