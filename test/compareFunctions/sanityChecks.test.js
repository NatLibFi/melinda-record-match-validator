import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import generateTests from '@natlibfi/fixugen';

import {performIsbnQualifierCheck} from '../../src/compareFunctions/sanityCheckIsbnQualifer.js';
import {performDaisySanityCheck} from '../../src/compareFunctions/sanityCheckDaisy.js';
import {performDvdSanityCheck} from '../../src/compareFunctions/sanityCheckDvd.js';
import {performAudioSanityCheck} from '../../src/compareFunctions/sanityCheckAudio.js';

testIsbnQualifier();
testDaisy();
testDvd();
testAudio();

// Unit-layer coverage for the sanity-check fallback branches that the
// index-level E2E fixtures (Daisy_*, 007_BluRay_vs_007_DVD) do not reach
// (see zoo/test-coverage-plan.md step 8, item 12).

function testIsbnQualifier() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareFunctions', 'sanityChecks', 'performIsbnQualifierCheck'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = performIsbnQualifierCheck({record1: recordA, record2: recordB});
    assert.deepEqual(result, expectedResults);
  }
}

function testDaisy() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareFunctions', 'sanityChecks', 'performDaisySanityCheck'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = performDaisySanityCheck({record1: recordA, record2: recordB});
    assert.deepEqual(result, expectedResults);
  }
}

function testDvd() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareFunctions', 'sanityChecks', 'performDvdSanityCheck'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = performDvdSanityCheck({record1: recordA, record2: recordB});
    assert.deepEqual(result, expectedResults);
  }
}

function testAudio() {
  generateTests({
    callback,
    path: [import.meta.dirname, '..', '..', 'test-fixtures', 'compareFunctions', 'sanityChecks', 'performAudioSanityCheck'],
    useMetadataFile: true,
    recurse: false,
    fixura: {
      reader: READERS.JSON
    }
  });

  function callback({getFixture, expectedResults}) {
    const recordA = new MarcRecord(getFixture('inputRecordA.json'), {subfieldValues: false});
    const recordB = new MarcRecord(getFixture('inputRecordB.json'), {subfieldValues: false});
    const result = performAudioSanityCheck({record1: recordA, record2: recordB});
    assert.deepEqual(result, expectedResults);
  }
}
