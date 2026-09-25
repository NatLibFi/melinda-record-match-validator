import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import generateTests from '@natlibfi/fixugen';

import {check773, check773Internal, compare773, get773} from '../../src/validators/field773.js';

testGet773();
testCheck773();
testCheck773Internal();
testCompare773();

function testGet773() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'field773', 'get773'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const marcRecord = new MarcRecord(getFixture('record.json'), {subfieldValues: false});
    const result = get773(marcRecord);
    assert.deepEqual(result, expectedResults);
  }
}

function testCheck773() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'field773', 'check773'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults, options = {}}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = check773({record1: recordA, record2: recordB, ...options});
    assert.deepEqual(result, expectedResults);
  }
}

function testCheck773Internal() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'field773', 'check773Internal'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults, options = {}}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = check773Internal({record1: recordA, record2: recordB, ...options});
    assert.deepEqual(result, expectedResults);
  }
}

function testCompare773() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'field773', 'compare773'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const recordValuesA = getFixture('recordValuesA.json');
    const recordValuesB = getFixture('recordValuesB.json');
    const result = compare773(recordValuesA, recordValuesB);
    assert.deepEqual(result, expectedResults);
  }
}
