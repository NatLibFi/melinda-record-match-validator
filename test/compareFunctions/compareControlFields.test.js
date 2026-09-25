import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import generateTests from '@natlibfi/fixugen';

import {compare001, compare005, check008} from '../../src/compareFunctions/compareControlFields.js';

testCompare001();
testCompare005();
testCheck008();

// compare001/compare005 operate on collected record values (see
// src/collectFunctions/collectControlFields.js), so the fixtures provide
// the recordValues objects directly.

function testCompare001() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareControlFields', 'compare001'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({recordValuesA, recordValuesB, expectedResults}) {
    const result = compare001(recordValuesA, recordValuesB);
    assert.deepEqual(result, expectedResults);
  }
}

function testCompare005() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareControlFields', 'compare005'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({recordValuesA, recordValuesB, expectedResults}) {
    const result = compare005(recordValuesA, recordValuesB);
    assert.deepEqual(result, expectedResults);
  }
}

// check008 operates on MarcRecords (collect + compare in one task).

function testCheck008() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareControlFields', 'check008'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = check008({record1: recordA, record2: recordB});
    assert.deepEqual(result, expectedResults);
  }
}
