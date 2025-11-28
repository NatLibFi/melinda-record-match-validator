
import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {getLanguageFeatures, compareLanguageFeatures} from '../src/validators/language.js';
import {MarcRecord} from '@natlibfi/marc-record';
import createDebugLogger from 'debug';


const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:language:test');
const debugData = debug.extend('data');

// Note: language feature is tested in matchers
testGet();
testCompare();

function testGet() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', 'test-fixtures', 'language', 'getLanguageFeatures'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const record = new MarcRecord(getFixture('record.json'), {subfieldValues: false});
    debugData(record);
    const languageFeatures = getLanguageFeatures(record);
    debugData(languageFeatures);
    assert.deepEqual(languageFeatures, expectedResults);
  }
}

function testCompare() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', 'test-fixtures', 'language', 'compareLanguageFeatures'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON1
    }
  });

  function callback({recordValuesA, recordValuesB, expectedResults}) {
    debug(`${JSON.stringify(recordValuesA)}`);
    debug(`${JSON.stringify(recordValuesB)}`);
    const checkResults = compareLanguageFeatures({languageFeatures1: recordValuesA, languageFeatures2: recordValuesB});
    debug(`Result: ${checkResults}`);
    assert.deepEqual(checkResults, expectedResults);
  }
}

