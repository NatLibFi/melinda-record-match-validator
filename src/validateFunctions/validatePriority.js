import createDebugLogger from 'debug';
import {isValidValue} from './validateUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:validateRecordCompareResults:validatePriority');

export function validatePriority(comparedRecordValues) {
  const wantedValues = ['A', 'B'];

  const prioOrder = [
    {name: 'recordCompletionLevel', value: isValidValue(comparedRecordValues['000'].recordCompletionLevel, wantedValues)},
    {name: 'isMelindaId', value: isValidValue(comparedRecordValues['001'].isMelindaId, wantedValues)},
    {name: 'commonIdentifiers', value: isValidValue(comparedRecordValues.commonIdentifiers.standardIdentifiers, wantedValues)},
    {name: 'LOW', value: isValidValue(comparedRecordValues.LOW, wantedValues)},
    {name: 'SID', value: isValidValue(comparedRecordValues.SID, wantedValues)},
    {name: 'CAT', value: isValidValue(comparedRecordValues.CAT, wantedValues)},
    {name: 'isViolaOrFikka', value: isValidValue(comparedRecordValues['042'], wantedValues)},
    {name: 'recordControlNumber', value: isValidValue(comparedRecordValues['773'].recordControlNumber, wantedValues)},
    {name: 'contentTypes', value: isValidValue(comparedRecordValues['336'], wantedValues)},
    {name: 'mediaTypes', value: isValidValue(comparedRecordValues['337'], wantedValues)},
    {name: 'carrierTypes', value: isValidValue(comparedRecordValues['338'], wantedValues)},
    {name: 'enumerationAndFirstPage', value: isValidValue(comparedRecordValues['773'].enumerationAndFirstPage, wantedValues)},
    {name: 'relatedParts', value: isValidValue(comparedRecordValues['773'].relatedParts, wantedValues)},
    {name: 'recentlyModified', value: isValidValue(comparedRecordValues['005'], wantedValues)},
    {name: 'default', value: true}
  ].filter((field) => {
    if (field.value) {
      debug('Prio value: %o, index: %o', field.value, field.name);
      return true;
    }

    return false;
  });


  return prioOrder[0];
}
