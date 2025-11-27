
import {compareLeader} from './compareFunctions/compareLeader.js';
import {compareCAT} from './fieldCAT.js';
import {compareLOW} from './fieldLOW.js';
import {compareSID} from './compareFunctions/compareFieldSID.js';
import {compareCommonIdentifiers} from './compareFunctions/commonIdentifiers.js';
import {compare001, compare005} from './compareFunctions/compareControlFields.js';
import {compare042} from './compareFunctions/compareField042.js';
import {compare245} from './field245.js';
import {compareAllTitleFeatures} from './title.js';
import {compare773} from './field773.js';
import {compare336ContentType, compare337MediaType, compare338CarrierType} from './field33X.js';

import createDebugLogger from 'debug';

export function compareRecordValues(recordValuesA, recordValuesB) {
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues');
  const debugDev = debug.extend('dev');
  //const debugData = debug.extend('data');

  debugDev('Record values A: %o', recordValuesA);
  debugDev('Record values B: %o', recordValuesB);

  return {
    'commonIdentifiers': compareCommonIdentifiers(recordValuesA, recordValuesB),
    '000': compareLeader(recordValuesA, recordValuesB),
    '001': compare001(recordValuesA, recordValuesB),
    '005': compare005(recordValuesA, recordValuesB), // A is more recently updated
    '042': compare042(recordValuesA, recordValuesB), // A nor B has any fikka or viola
    '245': compare245(recordValuesA, recordValuesB),
    'title': compareAllTitleFeatures(recordValuesA, recordValuesB),
    '336': compare336ContentType(recordValuesA, recordValuesB), // All-match = true, One-all-from-other = partialA tai partialB ja no-matches = false
    '337': compare337MediaType(recordValuesA, recordValuesB), // All-match = true, One-all-from-other = partialA tai partialB ja no-matches = false
    '338': compare338CarrierType(recordValuesA, recordValuesB), // All-match = true, One-all-from-other = partialA tai partialB ja no-matches = false
    '773': compare773(recordValuesA, recordValuesB),
    'SID': compareSID(recordValuesA, recordValuesB),
    'CAT': compareCAT(recordValuesA, recordValuesB),
    'LOW': compareLOW(recordValuesA, recordValuesB)
  };
}

/*
TRSLD                                                            +050
! Tietueen bibliografinen taso - osakohteet ja ei-osakohteet ei saa matchata
LDR   F07-01 mismatch                                            -599 unmatch
!008   F23-01 mismatch                                           -080
02800 a      mismatch                                            -080 continue
020## a      mismatch                                            -080 continue
022## a      mismatch                                            -080 continue
015## a      mismatch                                            -080 continue
337## a      mismatch                                            -080 unmatch
336## a      mismatch                                            -080 unmatch
245## a      keywords                       67%                  +070 continue
245## n      edition                        NUMERIC_MISMATCH     -050 skip two lines
245## n      mismatch                                            -025 continue
245## n      keywords                       67%                  +025 continue
245## p      mismatch                                            -050 continue
245## p      keywords                       67%                  +050 continue
245## h      mismatch                                            -050

!256##        edition                        ONE_MISSING_1        -080
008   F07-04 mismatch                                            -025 continue
008   F07-04 match_year_2                                        +020
260## c      edition                        NUMERIC_MISMATCH     -020

*/
