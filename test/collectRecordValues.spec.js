
import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import generateTests from '@natlibfi/fixugen';
import {collectRecordValues} from '../src/collectRecordValues';
import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:test');

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'collectRecordValues'],
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
  debug(JSON.stringify(recordValues));
  expect(recordValues).to.eql(expectedResults);
}
