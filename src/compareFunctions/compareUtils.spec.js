/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2022 University Of Helsinki (The National Library Of Finland)
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

import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';
import {compareArrayContent, compareValueContent} from './compareUtils';


const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:compareUtils:test');
const debugData = debug.extend('data');


generateTests({
  callback,
  path: [__dirname, '..', '..', 'test-fixtures', 'compareFunctions', 'compareValue'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  }
});

function callback({valueA, valueB, prefix = '', expectedResult}) {
  debugData(`Comparing values A: ${valueA} and B ${valueB} (prefix: ${prefix})`);
  const resultValue = compareValueContent(valueA, valueB, prefix);
  debugData(`Result: ${resultValue}`);
  debugData(`ExpectedResult: ${expectedResult}`);


  expect(resultValue).to.eql(expectedResult);
}

generateTests({
  callback1,
  path: [__dirname, '..', '..', 'test-fixtures', 'compareFunctions', 'compareArray'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  }
});

function callback1({arrayA, arrayB, expectedResult}) {

  const result = compareArrayContent(arrayA, arrayB);

  expect(result).to.eql(expectedResult);
}
