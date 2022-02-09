/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2020-2022 University Of Helsinki (The National Library Of Finland)
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

//import {fieldToString} from '@natlibfi/melinda-marc-record-merge-reducers/dist/reducers/utils';
import createDebugLogger from 'debug';
//import {nvdebug} from '../utils';
import {hasFields, getSubfield} from './collectUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:fields');

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

// Later on: handle 300 subfields 3, a, e? (needs alot parsing)
