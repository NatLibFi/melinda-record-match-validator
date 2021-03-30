import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:validateRecordCompareResults:validateFailure');

export function validateFailure(comparedRecordValues) {
  debug(comparedRecordValues);

  if (comparedRecordValues.commonIdentifiers.deleted) {
    debug('One or both are deleted');
    return {failure: true, reason: 'One or both are deleted', field: 'Deleted'};
  }

  if (!comparedRecordValues['000'].recordType) {
    debug('Leader record type mismatch');
    return {failure: true, reason: 'Leader record type mismatch', field: '000'};
  }

  if (!comparedRecordValues['000'].recordBibLevel) {
    debug('Leader record bib level mismatch');
    return {failure: true, reason: 'Leader record bib level mismatch', field: '000'};
  }

  if (!comparedRecordValues['336']) {
    debug('Record content type (336) mismatch');
    return {failure: true, reason: 'Record content type (336) mismatch', field: '336'};
  }

  if (!comparedRecordValues['337']) {
    debug('Media type (337) mismatch');
    return {failure: true, reason: 'Media type (337) mismatch', field: '337'};
  }

  if (!comparedRecordValues['338']) {
    debug('Carrier type (338) mismatch');
    return {failure: true, reason: 'Carrier type (338) mismatch', field: '338'};
  }

  if (!comparedRecordValues.SID) {
    debug('Same source SID mismatch');
    return {failure: true, reason: 'Same source SID mismatch', field: 'SID'};
  }

  if (!comparedRecordValues['773'].recordControlNumber) {
    debug('Record control number links (773) mismatch');
    return {failure: true, reason: 'Record control number links (773) mismatch', field: '773'};
  }

  return {failure: false};
}
