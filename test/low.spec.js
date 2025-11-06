
import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
//import {getLOW, checkLOW, checkLOWinternal} from '../src/fieldLOW.js';
import {getLOW, compareLOWinternal} from '../src/fieldLOW.js';
import createDebugLogger from 'debug';
import {MarcRecord} from '@natlibfi/marc-record';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:fieldLow:test');
const debugData = debug.extend('data');

testGetLow();

//testCheckLow();
testCompareLOWinternal();

function testGetLow() {
  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'low', 'getLow'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const record = new MarcRecord(getFixture('record.json'), {subfieldValues: false});
    debugData(record);
    const lows = getLOW(record);
    debugData(JSON.stringify(lows));
    expect(lows).to.eql(expectedResults);
  }
}

function testCompareLOWinternal() {

  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'low', 'compareLOWinternal'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON1
    }
  });


  function callback({expectedResults, recordValuesA, recordValuesB}) {
    debugData(JSON.stringify(recordValuesA));
    debugData(JSON.stringify(recordValuesB));
    const result = compareLOWinternal(recordValuesA, recordValuesB);
    debugData(JSON.stringify(result));
    expect(result).to.eql(expectedResults);
  }
}


/*

function testCheckLow() {
  testGetTitleFeaturesType();

  function testGetTitleFeaturesType() {
    generateTests({
      callback,
      path: [__dirname, '..', 'test-fixtures', 'low', 'checkLow'],
      useMetadataFile: true,
      recurse: false,
      fixura: {
        reader: READERS.JSON1
      }
    });

    function callback({title, expectedResults}) {
      debug(`Testing: ${JSON.stringify(title)}`);
      const type = getTitleFeaturesType(title);
      debug(`Result: ${type}`);
      expect(type).to.eql(expectedResults);
    }
  }
}
*/

