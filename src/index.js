/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2020-2022 University Of Helsinki (The National Library Of Finland)
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
import {isDeletedRecord} from '@natlibfi/melinda-commons';
import {MarcRecord} from '@natlibfi/marc-record';

import {checkSID} from './fieldSID';
import {checkLOW} from './fieldLOW';
import {checkCAT} from './fieldCAT';
import {check040b, check040e} from './field040';
import {check245} from './field245';
import {checkPublisher} from './field26X';
//import {getSubfieldValues} from './collectFunctions/collectUtils';
//import {collectRecordValues} from './collectRecordValues';
//import {compareRecordValues} from './compareRecordValues';
//import {validateCompareResults} from './validateRecordCompareResults';
import {check042} from './field042';
import {check336, check337, check338} from './field33X';
import {check773} from './field773';
import {check984} from './field984';
import {checkLeader} from './leader';
import {check005, check008} from './controlFields';
import {compareRecordsPartSetFeatures} from './partsAndSets';
import {performAudioSanityCheck} from './sanityCheckAudio';
import {performDaisySanityCheck} from './sanityCheckDaisy';
import {performDvdSanityCheck} from './sanityCheckDvd';
import {performIsbnQualifierCheck} from './sanityCheckIsbnQualifer';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');

function nvdebug(message) {
  debug(message);
  //console.info(message); // eslint-disable-line no-console
}

function checkExistence({record1, record2}) {
  if (record1 === undefined || record2 === undefined) {
    return false;
  }
  if (isDeletedRecord(record1) || isDeletedRecord(record2)) {
    return false;
  }
  return true;
}

const comparisonTasks = [ // NB! These are/should be in priority order!
  {'description': 'existence (validation only)', 'function': checkExistence},
  {'description': 'leader (validation and preference)', 'function': checkLeader}, // Prioritize LDR/17 (encoding level)
  {'description': 'publisher (264>260) (preference only)', 'function': checkPublisher}, // Bit high on the preference list, isn't it?
  {'description': '008 test (validation and preference)', 'function': check008},
  {'description': 'LOW test (validation and preference)', 'function': checkLOW}, // Priority order: FIKKA > ANY > NONE
  {'description': 'field 042: authentication code (preference only)', 'function': check042},
  {'description': 'CAT test (preference only)', 'function': checkCAT},
  // NB! I'd like to have a test for 008/06, but them specs for it are elusive?
  {'description': 'field 245 (title)', 'function': check245},
  {'description': 'field 336 (content type) test (validation and preference)', 'function': check336},
  {'description': 'field 337 (media type) test (validation and preference)', 'function': check337},
  {'description': 'field 338 (carrier type) test (validation and preference)', 'function': check338},
  {'description': '773 $wgq test (validation only)', 'function': check773},
  {'description': '040$b (language of cataloging) (preference only)', 'function': check040b},
  {'description': '040$e (description conventions) (preference only)', 'function': check040e},
  {'description': 'SID test (validation and preference)', 'function': checkSID},
  {'description': '005 timestamp test (validation and preference)', 'function': check005},
  {'description': 'audio sanity check (validation only)', 'function': performAudioSanityCheck},
  {'description': 'Daisy sanity check (validation only)', 'function': performDaisySanityCheck},
  {'description': 'DVD vs Blu-Ray sanity check (validation only)', 'function': performDvdSanityCheck},
  {'description': 'ISBN qualifier sanity check (validation only)', 'function': performIsbnQualifierCheck},
  {'description': 'Parts vs checks test (validation)', 'function': compareRecordsPartSetFeatures}
];

// Apply some recursion evilness/madness/badness to perform only the tests we really really really want.
function runComparisonTasks({nth, record1, record2, checkPreference = true, record1External = {}, record2External = {}}) {
  const currResult = comparisonTasks[nth].function({record1, record2, checkPreference, record1External, record2External});
  // NB! Aborts after the last task or after a failure (meaning currResult === false)! No further tests are performed. Recursion means optimization :D
  if (nth === comparisonTasks.length - 1 || currResult === false) {
    return [currResult];
  }
  return [currResult].concat(runComparisonTasks({nth: nth + 1, record1, record2, checkPreference, record1External, record2External}));
}

function makeComparisons({record1, record2, checkPreference = true, record1External = {}, record2External = {}}) {
  // Start with sanity check(s): if there are no tasks, it is not a failure:
  if (comparisonTasks.length === 0) {
    return true;
  }
  // Get results (up to the point of first failure):
  const results = runComparisonTasks({nth: 0, record1, record2, checkPreference, record1External, record2External});
  // If any test fails, return false.
  if (results.length < comparisonTasks.length || results[results.length - 1] === false) {
    nvdebug(`makeComparisons() failed. Reason: ${comparisonTasks[results.length - 1].description}. (TEST: ${results.length}/${comparisonTasks.length})`);
    return {result: false, reason: `${comparisonTasks[results.length - 1].description} failed`};
  }

  if (!checkPreference) {
    // This will also skip separate field 984 check
    return {result: true, reason: 'all tests passed'};
  }

  const field984Override = check984({record1, record2});
  if (field984Override === 'A' || field984Override === 'B') {
    return {result: field984Override, reason: 'Field 984 override applied (MRA-744)'};
  }

  const decisionPoint = results.findIndex(val => val !== true && val !== false);
  if (decisionPoint === -1) {
    return {result: true, reason: 'both records passed all tests, but no winner was found'};
  }
  return {result: results[decisionPoint], reason: `${results[decisionPoint]} won ${comparisonTasks[decisionPoint].description}`};
}

// {Record, source, yms}
// record1External/record2External includes external information for record (for example whether it is an incomingRecord or databaseRecord)

export default ({record1Object, record2Object, checkPreference = true, record1External = {}, record2External = {}}) => {
  //debug(recordAObject);

  // Create MarcRecords here to avoid problems with differing MarcRecord versions etc.
  const record1 = new MarcRecord(record1Object, {subfieldValues: false});
  const record2 = new MarcRecord(record2Object, {subfieldValues: false});

  // checkPreference should be multivalue:
  // X: NOT CHECK (current false), Y: CHECK MERGABILITY FOR HUMANS, Z: CHECK MERGABILITY FOR AUTOMATON (current true)
  //const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');

  //if (1) {
  // New version: Make checks only to the point of first failure...
  // console.log('ENTER THE PROGRAM');

  const result = makeComparisons({record1, record2, checkPreference, record1External, record2External});
  debug(`Comparison result: ${result.result}, reason: ${result.reason}`);
  if (result.result === false) {
    return {action: false, preference: false, message: result.reason};
  }

  return {action: 'merge', preference: {'name': result.reason, 'value': result.result}};
  //}
/*
  // We never get here...
  if (recordA === undefined || recordB === undefined) { // eslint-disable-line functional/no-conditional-statement
    throw new Error('Record missing!');
  }
  const recordValuesA = collectRecordValues(recordA);
  debug('Record values A: %o', recordValuesA);
  const recordValuesB = collectRecordValues(recordB);
  debug('Record values B: %o', recordValuesB);

  // Check record type if e & f -> false

  const comparedRecordValues = compareRecordValues(recordValuesA, recordValuesB);
  debug('Compared record values: %o', comparedRecordValues);

  return validateCompareResults(comparedRecordValues);
*/
};
