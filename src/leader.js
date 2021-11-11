/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2021 University Of Helsinki (The National Library Of Finland)
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
import {mapTypeOfRecord, mapBibliographicalLevel, mapEncodingLevel} from './collectFunctions/leader';
import {compareRecordCompletionLevel as compareEncodingLevel} from './compareFunctions/leader';

function getTypeOfRecord(record) {
  const description = mapTypeOfRecord(record.leader[6]); // Will trigger error, if value is invalid
  if (description) {
    return description.code;
  }
  return null;
}

function getBibliographicalLevel(record) {
  const description = mapBibliographicalLevel(record.leader[7]); // Will trigger error, if value is invalid
  if (description) {
    return description.code;
  }
  return null;
}

function getEncodingLevel(record) {
  const description = mapEncodingLevel(record.leader[17]); // Will trigger error, if value is invalid
  if (description) {
    return description.code;
  }
  return null;
}

export function isComponentPart(record) {
  if (['a', 'b', 'd'].includes(record.getBibliographicalLevel)) {
    return true;
  }
  // Should having a 773 (or 973) field imply that record is a component part?
  return false;
}

export function checkLeader(record1, record2, checkPreference = true) {
  // type of record:
  if (getTypeOfRecord(record1) !== getTypeOfRecord(record2)) {
    return false;
  }
  // bibliographical level:
  if (getBibliographicalLevel(record1) !== getBibliographicalLevel(record2)) {
    return false;
  }
  // encoding level
  // NB! We check the encoding level even with checkPreference===false, since it checks for legal values
  const encodingLevelPreference = compareEncodingLevel(getEncodingLevel(record1), getEncodingLevel(record2));
  if (checkPreference) {
    return encodingLevelPreference;
  }
  return encodingLevelPreference !== false;
  // NB! Should we handle LDR/05 (record status) value p - Increase in encoding level from prepublication?
}
