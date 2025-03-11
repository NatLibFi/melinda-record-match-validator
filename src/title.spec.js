
import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {getAllTitleFeatures, compareAllTitleFeatures} from './title';
import {MarcRecord} from '@natlibfi/marc-record';
import createDebugLogger from 'debug';


const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:title:test');
const debugData = debug.extend('data');

testGet();
testCheck();

function testGet() {
  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'title', 'getTitleFeatures'],
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
    expect(titleFeatures).to.eql(expectedResults);
  }
}

function testCheck() {
  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'title', 'checkTitleFeatures'],
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
    expect(checkResults).to.eql(expectedResults);
  }
}
