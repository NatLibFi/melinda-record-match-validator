import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import generateTests from '@natlibfi/fixugen';

import {checkLeader, checkTypeOfRecord, checkEncodingLevel, checkBibliographicLevel} from '../../src/compareFunctions/compareLeader.js';

testCheckLeader();
testCheckTypeOfRecord();
testCheckEncodingLevel();
testCheckBibliographicLevel();

// All check* functions operate directly on MarcRecords with 24-char leaders.
// Fixture metadata may carry an `options` object (checkPreference,
// record1External, record2External) which is spread into the call.
//
// Deliberately NOT covered (unreachable dead code, see zoo/test-coverage-plan.md):
// - getPrepublicationLevel lines 33-37: record.get(regex) returns [] for a
//   record without 500/594 fields (an array is truthy), so the falsy
//   `if (fields)` side can never execute for a valid MarcRecord.
// - rateValues lines 75-77 (missing rating array): both call sites in
//   checkEncodingLevel always pass a rating array. The "value not in rating
//   array" branches (lines 53-64) ARE reachable and are covered via
//   recordSource values outside the allowed list (checkEncodingLevel/14-16).

function testCheckLeader() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareLeader', 'checkLeader'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults, options = {}}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = checkLeader({record1: recordA, record2: recordB, ...options});
    assert.deepEqual(result, expectedResults);
  }
}

function testCheckTypeOfRecord() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareLeader', 'checkTypeOfRecord'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults, options = {}}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = checkTypeOfRecord({record1: recordA, record2: recordB, ...options});
    assert.deepEqual(result, expectedResults);
  }
}

function testCheckEncodingLevel() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareLeader', 'checkEncodingLevel'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults, options = {}}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = checkEncodingLevel({record1: recordA, record2: recordB, ...options});
    assert.deepEqual(result, expectedResults);
  }
}

function testCheckBibliographicLevel() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareLeader', 'checkBibliographicLevel'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = checkBibliographicLevel({record1: recordA, record2: recordB});
    assert.deepEqual(result, expectedResults);
  }
}
