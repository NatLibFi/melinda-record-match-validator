/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2021-2022 University Of Helsinki (The National Library Of Finland)
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
//import createDebugLogger from 'debug';

//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:partsAndSets:test');
//const debugData = debug.extend('data');


// Extract partSetFeatures from a record
export function getPartSetFeatures(record) {
  if (record) {
    return {type: 'unknown'};
  }
  return {type: 'unknown'};
}

// Compare two records by their partSetFeatures
export function compareRecordsPartSetFeatures({record1, record2}) {

  const partSetFeatures1 = getPartSetFeatures(record1);
  const partSetFeatures2 = getPartSetFeatures(record2);

  return checkPartSetFeatures({partSetFeatures1, partSetFeatures2});
}

// Check two sets of partSetFeatures
export function checkPartSetFeatures({partSetFeatures1, partSetFeatures2}) {

  if (partSetFeatures1.type === partSetFeatures2.type) {
    return true;
  }

  if (partSetFeatures1.type === 'unknown' || partSetFeatures2.type === 'unknown') {
    return true;
  }

  if (partSetFeatures1.type !== partSetFeatures2.type) {
    return false;
  }

  // Fallback, but we should not end up here
  return false;
}

