import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:validateRecordCompareResults:validateFailure');

export function validateFailure(comparedRecordValues) {
  debug(comparedRecordValues);

  return false;
}
