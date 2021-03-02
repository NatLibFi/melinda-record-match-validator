/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2020 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-record-match-validator
*
* melinda-record-match-validator program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-record-match-validator is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

import createDebugLogger from 'debug';
import moment from 'moment';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:fields');

export function get042(record) {
  return hasFields('042', record, getSubfield, 'a');
}

// 245 n & p
// tosin nää ei varmaan kuitenkaan tuu onixista, eli KV:n ennakkotietotapauksessa toi blokkais kaikki, joissa Melindassa olis tehty noi valmiiksi nimekkeeseen
// niissä tapauksissa, joissa tuodaan alunperin marc21-kirjastodataa tai yhdistetään Melindan tietueita, tää on oleellisehko
export function get245(record) {
  const [f245] = hasFields('245', record, f245ToJSON);
  debug('Field 245 info: %o', f245);

  return f245;

  function f245ToJSON(field) {
    const title = getSubfield(field, 'a');
    const numberOfPartInSectionOfAWork = getSubfield(field, 'n') || null;
    const nameOfPartInSectionOfAWork = getSubfield(field, 'p') || null;

    return {title, numberOfPartInSectionOfAWork, nameOfPartInSectionOfAWork};
  }
}

// 300 laajuus

/*
336, 337, 338 $b:t
  automaatiolla pitää miettiä jotain parempaa logiikkaa - mut tekstiaineistoissa jos toinen tietue on 337 $b c ja toinen on 337 $b n niin yhdistämistä ei saa tehdä.
  (Tietokonekäyttöinen teksti ja fyysinen teksti)
*/

export function get336bContentType(record) {
  const contentTypes = hasFields('336', record, getSubfield, 'b');
  debug('Field 336 content types: %o', contentTypes);

  return {contentTypes};
}

export function get337bMediaType(record) {
  const mediaTypes = hasFields('337', record, getSubfield, 'b');
  debug('Field 337 media types: %o', mediaTypes);

  return {mediaTypes};
}

export function get338bCarrierType(record) {
  const carrierTypes = hasFields('338', record, getSubfield, 'b');
  debug('Field 338 carrier types: %o', carrierTypes);

  return {carrierTypes};
}

export function get773(record) {
  const F773s = hasFields('773', record).map(f773 => f733ToJSON(f773));
  debug('Field 773s: %o', F773s);

  return F773s;

  function f733ToJSON(f773) {
    const recordControlNumber = f773.subfields.filter(sub => sub.code === 'w').map(sub => sub.value);
    const relatedParts = f773.subfields.filter(sub => sub.code === 'g').map(sub => sub.value);
    const enumerationAndFirstPage = f773.subfields.filter(sub => sub.code === 'q').map(sub => sub.value);

    return {recordControlNumber, relatedParts, enumerationAndFirstPage};
  }
}

export function getCAT(record) {
  // if not fields []
  const CATs = hasFields('CAT', record, catToJSON);
  const [latest, ...otherCats] = CATs.reverse(); // eslint-disable-line functional/immutable-data

  if (latest === undefined) {
    return {latest: null, otherCats: []};
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

function hasFields(tag, record, useFunction, useFunctionParameters) {
  const fields = record.get(tag);
  if (fields === []) {
    return [];
  }

  if (useFunction !== undefined) {
    return fields.map(field => useFunction(field, useFunctionParameters));
  }

  return fields;
}

function getSubfield(field, subfieldCode) {
  const [value] = field.subfields.filter(sub => sub.code === subfieldCode).map(sub => sub.value);
  return value;
}
