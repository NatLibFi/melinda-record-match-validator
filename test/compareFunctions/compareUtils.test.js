import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';
import {compareArrayContent, compareValueContent, compareArrayContentRequireAll} from '../../src/compareFunctions/compareUtils.js';


const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:compareUtils:test');
const debugData = debug.extend('data');

testValue();
testArray();
testArrayRequireAll();

function testValue() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareFunctions', 'compareValue'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({valueA, valueB, prefix = '', expectedResult}) {
    debugData(`Comparing values A: ${valueA} and B ${valueB} (prefix: ${prefix})`);
    const resultValue = compareValueContent(valueA, valueB, prefix);
    debugData(`Result: ${resultValue}`);
    debugData(`ExpectedResult: ${expectedResult}`);

    assert.deepEqual(resultValue, expectedResult)
    //expect(resultValue).to.eql(expectedResult);
  }
}

function testArray() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareFunctions', 'compareArray'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({arrayA, arrayB, expectedResult}) {

    const result = compareArrayContent(arrayA, arrayB);
    assert.deepEqual(result, expectedResult)
  }
}

function testArrayRequireAll() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareFunctions', 'compareArrayRequireAll'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({arrayA, arrayB, expectedResult}) {

    const result = compareArrayContentRequireAll(arrayA, arrayB);

    assert.deepEqual(result, expectedResult)
  }
}
