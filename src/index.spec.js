
import {expect} from 'chai';
//import {MarcRecord} from '@natlibfi/marc-record';
import createDebugLogger from 'debug';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import validateRecordMatch from './index';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index:test');

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'index'],
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
  expect(compareResults).to.eql(expectedResults);
}
