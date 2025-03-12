
import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {parseExtentString, getExtentType} from '../src/partsAndSetsExtent';
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


