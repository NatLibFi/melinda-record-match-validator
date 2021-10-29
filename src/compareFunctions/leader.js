/*
'000': {
    'recordBibLevel': true,
    'recordCompletionLevel': 'A', // A has better value
    'recordState': true,
    'recordType': true
}
*/
import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:leader');

function rateValues(valueA, valueB, rateArray) {
  debug('%o vs %o', valueA, valueB);
  if (valueA.code === valueB.code) {
    debug('Both same: returning true');
    return true;
  }

  if (rateArray) {
    const ratingOfA = rateArray.indexOf(valueA.code) + 1;
    const ratingOfB = rateArray.indexOf(valueB.code) + 1;

    if (ratingOfA === 0 || ratingOfB === 0) {
      debug('Value not found from array');
      return false;
    }

    if (ratingOfA < ratingOfB) {
      debug('A better: returning A');
      return 'A';
    }

    debug('B better: returning B');
    return 'B';
  }

  debug('Both different: returning false');
  return false;
}

export function compareRecordType(a, b) {
  debug('Record A type: %o', a);
  debug('Record B type: %o', b);

  return rateValues(a, b);
}

export function compareRecordBibLevel(a, b) {
  debug('Record A bib level: %o', a);
  debug('Record B bib level: %o', b);

  return rateValues(a, b);
}

export function compareRecordCompletionLevel(a, b) {
  debug('Record A completion level: %o', a);
  debug('Record B completion level: %o', b);

  /*
  # - Full level
  1 - Full level, material not examined
  2 - Less-than-full level, material not examined
  3 - Abbreviated level
  4 - Core level
  5 - Partial (preliminary) level
  7 - Minimal level
  8 - Prepublication level
  u - Unknown
  z - Not applicable
  */
  const rateArray = [' ', '1', '2', '3', '4', '5', '7', 'u', 'z', '8'];

  return rateValues(a, b, rateArray);
}

export function compareRecordInfo(recordValuesA, recordValuesB) {
  const f000A = recordValuesA['000'];
  const f000B = recordValuesB['000'];

  return {
    recordType: compareRecordType(f000A.recordType, f000B.recordType),
    recordBibLevel: compareRecordBibLevel(f000A.recordCompletionLevel, f000B.recordCompletionLevel),
    recordCompletionLevel: compareRecordCompletionLevel(f000A.recordCompletionLevel, f000B.recordCompletionLevel)
  };
}
