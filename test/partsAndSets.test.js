
import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {getPartSetFeatures, checkPartSetFeatures, getTitleFeaturesType} from '../src/validators/partsAndSets.js';
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
    path: [import.meta.dirname, '..', 'test-fixtures', 'partsAndSets', 'getPartSetFeatures'],
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
    assert.deepEqual(partSetFeatures.type, expectedResults.type);
  }
}

function testCheck() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', 'test-fixtures', 'partsAndSets', 'checkPartSetFeatures'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON1
    }
  });

  function callback({recordValuesA, recordValuesB, expectedResults}) {
    const checkResults = checkPartSetFeatures({partSetFeatures1: recordValuesA, partSetFeatures2: recordValuesB});
    debug(`Result: ${checkResults}`);
    assert.deepEqual(checkResults, expectedResults);
  }
}

function testTitle() {
  testGetTitleFeaturesType();

  function testGetTitleFeaturesType() {
    generateTests({
      callback,
      path: [import.meta.dirname, '..', 'test-fixtures', 'partsAndSets', 'partsAndSetsTitleFeatures'],
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
      assert(type, expectedResults);
    }
  }
}
