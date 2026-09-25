
import assert from 'node:assert';
//import {MarcRecord} from '@natlibfi/marc-record';
import {test} from 'node:test';
import createDebugLogger from 'debug';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {matchValidationForMergeUI as validateRecordMatch} from '../src/index.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index-merge-ui:test');

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'index-merge-ui'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  }
});


function callback({getFixture, record1External, record2External}) {
  const record1Object = getFixture('inputRecordA.json') || getFixture('inputRecord1.json');
  const record2Object = getFixture('inputRecordB.json') || getFixture('inputRecord2.json');
  const expectedResults = getFixture('expectedResults.json');
  debug(record1Object);
  debug(record2Object);
  const compareResults = validateRecordMatch({record1Object, record2Object, record1External, record2External});
  debug(compareResults);
  assert.deepEqual(compareResults, expectedResults);
  //expect(compareResults).to.eql(expectedResults);
}

// Direct (non-fixture) tests for makeComparisons() edge paths that fixugen
// fixtures cannot express (they always pass real records and the default task
// tables; see zoo/test-coverage-plan.md step 7).

const minimalRecord = {
  leader: '01092cas a22003494i 4500',
  fields: [
    {tag: '001', value: '001000001'},
    {tag: '003', value: 'FI-MELINDA'},
    {tag: '005', value: '20200101000000.0'},
    {tag: '008', value: '010101c19879999nr |||p| ||||||||||0eng|c'},
    {tag: '041', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'eng'}]},
    {tag: '245', ind1: '0', ind2: '0', subfields: [{code: 'a', value: 'Some journal /'}]},
    {tag: '336', ind1: ' ', ind2: ' ', subfields: [{code: 'b', value: 'txt'}]},
    {tag: '337', ind1: ' ', ind2: ' ', subfields: [{code: 'b', value: 'z'}]},
    {tag: '338', ind1: ' ', ind2: ' ', subfields: [{code: 'b', value: 'zz'}]}
  ]
};

test('mergeUI with no comparison tasks defined', () => {
  // makeComparisons() with zero tasks returns {result: true, reason: 'No
  // rules defined'}, which filterResultsForMergeUI() drops (result === true),
  // so MergeUI reports no actionable messages.
  const result = validateRecordMatch({record1Object: minimalRecord, record2Object: minimalRecord, comparisonTasks: []});
  assert.deepEqual(result, []);
});

test('mergeUI with checkPreference: false', () => {
  // With checkPreference: false the f984 override block is skipped entirely
  // and makeComparisons() returns the plain allResults array. All-passing
  // identical records produce no actionable messages → empty array.
  const result = validateRecordMatch({record1Object: minimalRecord, record2Object: minimalRecord, checkPreference: false});
  assert.deepEqual(result, []);
});
