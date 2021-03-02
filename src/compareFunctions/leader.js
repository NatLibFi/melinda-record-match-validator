/*
'000': {
    'recordBibLevel': true,
    'recordCompletionLevel': 'A', // A has better value
    'recordState': true,
    'recordType': true
}
*/
import createDebugLogger from 'debug';

export function compareRecordInfo(recordValuesA, recordValuesB) {
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:leader');

  const f000A = recordValuesA['000'];
  const f000B = recordValuesB['000'];

  return {
    recordType: compareRecordType(),
    recordBibLevel: compareRecordBibLevel(),
    recordCompletionLevel: compareRecordCompletionLevel()
  };

  function compareRecordType() {
    debug('Record A type: %o', f000A.recordType);
    debug('Record B type: %o', f000B.recordType);

    return rateValues(f000A.recordType, f000B.recordType);
  }

  function compareRecordBibLevel() {
    debug('Record A bib level: %o', f000A.recordBibLevel);
    debug('Record B bib level: %o', f000B.recordBibLevel);

    return rateValues(f000A.recordBibLevel, f000B.recordBibLevel);
  }

  function compareRecordCompletionLevel() {
    debug('Record A completion level: %o', f000A.recordCompletionLevel);
    debug('Record B completion level: %o', f000B.recordCompletionLevel);

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

    return rateValues(f000A.recordCompletionLevel, f000B.recordCompletionLevel, rateArray);
  }

  function rateValues(valueA, valueB, rateArray) {
    debug('%o vs %o', valueA, valueB);
    if (valueA.code === valueB.code) {
      debug('Both same: returning true');
      return true;
    }

    if (rateArray) {
      const ratingOfA = rateArray.indexOf(valueA) + 1;
      const ratingOfB = rateArray.indexOf(valueB) + 1;

      if (ratingOfA > ratingOfB) {
        debug('A better: returning A');
        return 'A';
      }

      debug('B better: returning B');
      return 'B';
    }

    debug('Both different: returning false');
    return false;
  }
}
