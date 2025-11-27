
import assert from 'node:assert';
import createDebugLogger from 'debug';

import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import generateTests from '@natlibfi/fixugen';

//import {checkLOW, checkLOWinternal} from '../src/fieldLOW.js';
import {checkLOW, compareLOWinternal} from '../src/compareFunctions/compareFieldLOW.js';
import {getLOW} from '../src/collectFunctions/collectUtils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:fieldLow:test');
const debugData = debug.extend('data');

testGetLow();

testCheckLow();
testCompareLOWinternal();

function testGetLow() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', 'test-fixtures', 'low', 'getLow'],
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
    assert.deepEqual(lows, expectedResults);
    //expect(lows).to.eql(expectedResults);
  }
}

function testCompareLOWinternal() {

  generateTests({
    callback,
    path: [import.meta.dirname, '..', 'test-fixtures', 'low', 'compareLOWinternal'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });


  function callback({expectedResults, recordValuesA, recordValuesB}) {
    debugData(JSON.stringify(recordValuesA));
    debugData(JSON.stringify(recordValuesB));
    const result = compareLOWinternal(recordValuesA, recordValuesB);
    debugData(JSON.stringify(result));
    assert.deepEqual(result, expectedResults);
    //expect(result).to.eql(expectedResults);
  }
}


function testCheckLow() {

  generateTests({
      callback,
      path: [import.meta.dirname, '..', 'test-fixtures', 'low', 'checkLow'],
      useMetadataFile: true,
      recurse: false,
      fixura: {
        reader: READERS.JSON
      }
    });

    function callback({getFixture, expectedResults}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
      const result = checkLOW({record1: recordA, record2: recordB});
      debug(`Result: ${result}`);
      assert.deepEqual(result, expectedResults);
      //expect(type).to.eql(expectedResults);
    }
  }

