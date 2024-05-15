
import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {compareRecordValues} from './compareRecordValues';

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'compareRecordValues'],
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
  expect(compareResults).to.eql(expectedResults);
}
