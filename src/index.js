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
import {collectRecordValues} from './collectRecordValues';
import {compareRecordValues} from './compareRecordValues';
import {validateCompareResults} from './validateRecordCompareResults';

// {Record, source, yms}
export default (recordA, recordB) => {
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');

  if (recordA === undefined || recordB === undefined) { // eslint-disable-line functional/no-conditional-statement
    throw new Error('Record missing!');
  }

  const recordValuesA = collectRecordValues(recordA);
  debug('Record values A: %o', recordValuesA);
  const recordValuesB = collectRecordValues(recordB);
  debug('Record values B: %o', recordValuesB);

  // Check record type if e & f -> false


  const comparedRecordValues = compareRecordValues(recordValuesA, recordValuesB);
  debug('Compared record values: %o', comparedRecordValues);

  return validateCompareResults(comparedRecordValues);
};
