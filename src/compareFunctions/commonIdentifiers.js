import createDebugLogger from 'debug';
import {compareArrayContent, compareValueContent} from './compareUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:compareCommonIdentifiers');


export function compareCommonIdentifiers(recordValuesA, recordValuesB) {
  const commonIdentifiersA = recordValuesA.commonIdentifiers;
  const commonIdentifiersB = recordValuesB.commonIdentifiers;
  debug('%o vs %o', commonIdentifiersA, commonIdentifiersB);

  return {
    'deleted': commonIdentifiersA.deleted || commonIdentifiersB.deleted,
    'standardIdentifiers': compareArrayContent(commonIdentifiersA.standardIdentifiers, commonIdentifiersB.standardIdentifiers, true),
    'title': compareValueContent(commonIdentifiersA.title, commonIdentifiersB.title)
  };
}
