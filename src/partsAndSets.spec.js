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

import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {getPartSetFeatures, checkPartSetFeatures, getTitleType} from './partsAndSets';
import {MarcRecord} from '@natlibfi/marc-record';
import createDebugLogger from 'debug';


const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:partsAndSets:test');
const debugData = debug.extend('data');

testGet();
testCheck();
testTitle();

function testGet() {
  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'partsAndSets', 'getPartSetFeatures'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const record = new MarcRecord(getFixture('record.json'), {subfieldValues: false});
    debugData(record);
    const partSetFeatures = getPartSetFeatures(record);
    debugData(partSetFeatures);
    expect(partSetFeatures.type).to.eql(expectedResults.type);
  }
}

function testCheck() {
  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'partsAndSets', 'checkPartSetFeatures'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON1
    }
  });

  function callback({recordValuesA, recordValuesB, expectedResults}) {
    const checkResults = checkPartSetFeatures({partSetFeatures1: recordValuesA, partSetFeatures2: recordValuesB});
    debug(`Result: ${checkResults}`);
    expect(checkResults).to.eql(expectedResults);
  }
}

function testTitle() {
  testGetTitleType();

  function testGetTitleType() {
    generateTests({
      callback,
      path: [__dirname, '..', 'test-fixtures', 'partsAndSets', 'partsAndSetsTitle'],
      useMetadataFile: true,
      recurse: false,
      fixura: {
        reader: READERS.JSON1
      }
    });

    function callback({title, expectedResults}) {
      debug(`Testing: ${JSON.stringify(title)}`);
      const type = getTitleType(title);
      debug(`Result: ${type}`);
      expect(type).to.eql(expectedResults);
    }
  }
}
