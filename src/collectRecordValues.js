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

import {getRecordTitle, getRecordStandardIdentifiers, isDeletedRecord} from '@natlibfi/melinda-commons';
import {getRecordInfo} from './leader';
import {get001, get005} from './collectFunctions/controlFields';
import {getCAT} from './fieldCAT';
import {getLOW} from './fieldLOW';
import {getSID} from './fieldSID';
import {get042} from './field042';
import {get245} from './collectFunctions/fields';
import {get336bContentType, get337bMediaType, get338bCarrierType} from './field33X';
import {get773} from './field773';

export function collectRecordValues(record) {
  return {
    'commonIdentifiers': {
      title: getRecordTitle(record), // not needed
      standardIdentifiers: getRecordStandardIdentifiers(record),
      deleted: isDeletedRecord(record)
    },
    '000': getRecordInfo(record),
    '001': get001(record),
    '005': get005(record),
    '042': get042(record),
    '245': get245(record),
    '336': get336bContentType(record),
    '337': get337bMediaType(record),
    '338': get338bCarrierType(record),
    '773': get773(record),
    'CAT': getCAT(record),
    'LOW': getLOW(record),
    'SID': getSID(record)
  };
}
