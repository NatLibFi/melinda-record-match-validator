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
import {parseExtentString, getExtentType} from './partsAndSetsExtent';
//import createDebugLogger from 'debug';


//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:partsAndSets:test');
//const debugData = debug.extend('data');

testParseExtentString();
testGetExtentType();

function testParseExtentString() {
  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'partsAndSetsExtent', 'parseExtentString'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({string, expectedResults}) {

    const result = parseExtentString(string);
    expect(result).to.eql(expectedResults);
  }
}


function testGetExtentType() {
  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'partsAndSetsExtent', 'getExtentType'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({array, expectedResults}) {

    const result = getExtentType(array);
    expect(result).to.eql(expectedResults);
  }
}


