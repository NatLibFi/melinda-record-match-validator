import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import generateTests from '@natlibfi/fixugen';

import {checkCAT, compareCAT, getCAT} from '../../src/validators/fieldCAT.js';

testGetCAT();
testCheckCAT();
testCompareCAT();

function testGetCAT() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'CAT', 'getCAT'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const marcRecord = new MarcRecord(getFixture('record.json'), {subfieldValues: false});
    const result = getCAT(marcRecord);
    assert.deepEqual(result, expectedResults);
  }
}

function testCheckCAT() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'CAT', 'checkCAT'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = checkCAT({record1: recordA, record2: recordB});
    assert.deepEqual(result, expectedResults);
  }
}

function testCompareCAT() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'CAT', 'compareCAT'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const recordValuesA = getFixture('recordValuesA.json');
    const recordValuesB = getFixture('recordValuesB.json');
    const result = compareCAT(recordValuesA, recordValuesB);
    assert.deepEqual(result, expectedResults);
  }
}
