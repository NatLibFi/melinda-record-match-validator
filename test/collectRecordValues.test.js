
import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import generateTests from '@natlibfi/fixugen';
import {collectRecordValues} from '../src/collectRecordValues.js';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'collectRecordValues'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  }
});

function callback({getFixture}) {
  const record = new MarcRecord(getFixture('inputRecord.json'), {subfieldValues: false});
  const expectedResults = getFixture('expectedResults.json');
  const recordValues = collectRecordValues(record);

  //console.log('HALUTTIIN:');
  //console.log(JSON.stringify(expectedResults));
  //console.log('SAATIIN:');
  //console.log(JSON.stringify(recordValues));

  assert.deepEqual(recordValues, expectedResults);
}
