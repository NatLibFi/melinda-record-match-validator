
import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {compareRecordValues} from '../src/compareRecordValues.js';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'compareRecordValues'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  }
});

function callback({getFixture}) {
  const recordValuesA = getFixture('inputRecordValuesA.json');
  const recordValuesB = getFixture('inputRecordValuesB.json');
  const expectedResults = getFixture('expectedResults.json');
  const compareResults = compareRecordValues(recordValuesA, recordValuesB);
  assert.deepEqual(compareResults, expectedResults);
}
