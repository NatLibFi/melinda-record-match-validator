import createDebugLogger from 'debug';
import {compareArrayContent, compareValueContent} from './compareUtils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:compareCommonIdentifiers');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');


export function compareCommonIdentifiers(recordValuesA, recordValuesB) {
  const commonIdentifiersA = recordValuesA.commonIdentifiers;
  const commonIdentifiersB = recordValuesB.commonIdentifiers;
  debugDev('%o vs %o', commonIdentifiersA, commonIdentifiersB);

  return {
    'deleted': commonIdentifiersA.deleted || commonIdentifiersB.deleted,
    'standardIdentifiers': compareArrayContent(commonIdentifiersA.standardIdentifiers, commonIdentifiersB.standardIdentifiers, true),
    'title': compareValueContent(commonIdentifiersA.title, commonIdentifiersB.title)
  };
}
