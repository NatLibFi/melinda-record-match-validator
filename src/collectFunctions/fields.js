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
import {hasFields, getSubfield} from './collectUtils';

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
    const numberOfPartInSectionOfAWork = getSubfield(field, 'n');
    const nameOfPartInSectionOfAWork = getSubfield(field, 'p');

    return {title, numberOfPartInSectionOfAWork, nameOfPartInSectionOfAWork};
  }
}

// Later 300 subfields 3, a, e (needs alot parsing)

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
  const F773s = hasFields('773', record).map(f773 => f773ToJSON(f773));
  debug('Field 773s: %o', F773s);

  return F773s;

  function f773ToJSON(f773) {
    const recordControlNumber = getSubfield(f773, 'w'); // NB! It is legal to have multiple $w subfields!
    const relatedParts = getSubfield(f773, 'g');
    const enumerationAndFirstPage = getSubfield(f773, 'q');

    return {recordControlNumber, relatedParts, enumerationAndFirstPage};
  }
}
