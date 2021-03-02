/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2020 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-record-match-validator
*
* melinda-record-match-validator program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-record-match-validator is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/
import createDebugLogger from 'debug';
import {compareRecordInfo} from './compareFunctions/leader';

export function compareRecordValues(recordValuesA, recordValuesB) {
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues');
  debug('Record values A: %o', recordValuesA);
  debug('Record values B: %o', recordValuesB);

  return {
    '336': true, // All-match = true, One-all-from-other = partialA tai partialB ja no-matches = false
    '337': 'partialA', // All-match = true, One-all-from-other = partialA tai partialB ja no-matches = false
    '338': false, // All-match = true, One-all-from-other = partialA tai partialB ja no-matches = false
    '773': {
      'enumerationAndFirstPage': false,
      'recordControlNumber': true,
      'relatedParts': true
    },
    '000': compareRecordInfo(recordValuesA, recordValuesB),
    '001': false,
    '005': 'A', // A is more recently updated
    '042': false, // A nor B has any fikka or viola
    'CAT': {
      'latest': 'A', // Needs some planing
      'otherCats': true
    },
    'LOW': false,
    'SID': true,
    'commonIdentifiers': {
      'deleted': true, // Both has false
      'standardIdentifiers': true, // All-match = true, One-all-from-other = partialA tai partialB ja no-matches = false
      'title': true // Both have same title
    }
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
