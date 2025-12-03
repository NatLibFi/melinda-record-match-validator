
import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {getAllTitleFeatures} from '../src/collectFunctions/collectTitle.js';
import {compareAllTitleFeatures} from '../src/compareFunctions/compareTitle.js';
import {MarcRecord} from '@natlibfi/marc-record';
import createDebugLogger from 'debug';


const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:title:test');
const debugData = debug.extend('data');

testGet();
testCheck();

function testGet() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', 'test-fixtures', 'title', 'getTitleFeatures'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const record = new MarcRecord(getFixture('record.json'), {subfieldValues: false});
    debugData(record);
    const titleFeatures = getAllTitleFeatures(record);
    debugData(JSON.stringify(titleFeatures));
    assert.deepEqual(titleFeatures, expectedResults);
  }
}

function testCheck() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', 'test-fixtures', 'title', 'checkTitleFeatures'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON1
    }
  });

  function callback({recordValuesA, recordValuesB, expectedResults}) {
    //debug(recordValuesA);
    const checkResults = compareAllTitleFeatures(recordValuesA, recordValuesB);
    debug(`Result: ${JSON.stringify(checkResults)}`);
    assert.deepEqual(checkResults, expectedResults);
  }
}
