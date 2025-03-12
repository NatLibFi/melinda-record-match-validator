
import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {getPartSetFeatures, checkPartSetFeatures, getTitleFeaturesType} from '../src/partsAndSets';
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
  testGetTitleFeaturesType();

  function testGetTitleFeaturesType() {
    generateTests({
      callback,
      path: [__dirname, '..', 'test-fixtures', 'partsAndSets', 'partsAndSetsTitleFeatures'],
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
