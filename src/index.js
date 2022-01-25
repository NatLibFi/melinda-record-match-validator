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

import {checkLOW, checkSID} from './alephFields';
import {check040b, check040e} from './field040';
import {checkPublisher} from './field26X';
import {getSubfieldValues} from './collectFunctions/collectUtils';
import {normalize773w} from './collectFunctions/fields';
//import {collectRecordValues} from './collectRecordValues';
//import {compareRecordValues} from './compareRecordValues';
//import {validateCompareResults} from './validateRecordCompareResults';
import {checkLeader} from './leader';
import {fieldGetNonRepeatableValue, fieldHasValidNonRepeatableSubfield, fieldToString, isComponentPart, sameControlNumberIdentifier, subfieldSetsAreEqual} from './utils';

import {cloneAndNormalizeField} from '@natlibfi/melinda-marc-record-merge-reducers/dist/reducers/normalize';

//import {fieldStripPunctuation as stripPunctuation} from '../node_modules/@natlibfi/melinda-marc-record-merge-reducers/dist/reducers/punctuation';
//import {subfieldsAreIdentical} from '@natlibfi/melinda-marc-record-merge-reducers/dist/reducers/utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');

function nvdebug(message) {
  debug(message);
  console.info(message); // eslint-disable-line no-console
}

function checkExistence(record1, record2) {
  if (record1 === undefined || record2 === undefined) {
    return false;
  }
  if (isDeletedRecord(record1) || isDeletedRecord(record2)) {
    return false;
  }
  return true;
}

function isValid33X(field) {
  if (!['336', '337', '338'].includes(field.tag)) {
    return false;
  }
  if (!['a', 'b', '2'].every(subfieldCode => fieldHasValidNonRepeatableSubfield(field, subfieldCode))) {
    return false;
  }
  // We might have some control subfield checks here?!?
  return true;
}


function check042(record1, record2) {
  // Look for NatLibFi authentication codes (finb and finbd) from within 042$a subfields, and give one point for each of the two.
  const score1 = recordScore042Field(record1);
  const score2 = recordScore042Field(record2);
  nvdebug(`042 scores: ${score1} vs ${score2}`);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }
  return true; // This test does not fail

  function recordScore042Field(record) {
    const fields = record.get('042');
    if (fields.length !== 1) {
      return 0;
    }
    return score042SubfieldAValues(getSubfieldValues(fields[0], 'a'));
  }

  function score042SubfieldAValues(values) {
    return (values.includes('finb') ? 1 : 0) + (values.includes('finbd') ? 1 : 0);
  }
}

function check245(record1, record2) {
  // Get both 245 fields and remove punctuation for easier comparisons:

  const fields1 = record1.get('245');
  const fields2 = record2.get('245');
  if (fields1.length !== 1 || fields2.length !== 1) {
    return false;
  }

  // NB! punctuation removal code has not been perfectly tested yet, and it does not cover all fields yet.
  // So test and fix and test and fix...

  const clone1 = cloneAndNormalizeField(fields1[0]);
  const clone2 = cloneAndNormalizeField(fields2[0]);
  //return true;
  nvdebug(fieldToString(clone1));
  nvdebug(fieldToString(clone2));
  if (!check245a(clone1, clone2) || !check245b(clone1, clone2) ||
    !subfieldSetsAreEqual([clone1], [clone2], 'n') || !subfieldSetsAreEqual([clone1], [clone2], 'p')) {
    return false;
  }
  // NB! How about: /c?/ and /n+/ ? Should we handle them?

  return true;

  function check245a(field1, field2) {
    const a1 = fieldGetNonRepeatableValue(field1, 'a');
    const a2 = fieldGetNonRepeatableValue(field2, 'a');
    if (a1 === null || a2 === null || a1 !== a2) {
      return false;
    }
    return true;
  }

  function check245b(field1, field2) {
    const b1 = fieldGetNonRepeatableValue(field1, 'b');
    const b2 = fieldGetNonRepeatableValue(field2, 'b');
    if (b1 === null || b2 === null) {
      return true; // subtitle is considered optional, and it's omission won't prevent proceeding
    }
    return b1 === b2;
  }
}

function check33X(record1, record2, tag) {
  // Returns just true (=match) or false (=mismatch).
  // Compare $b subfields only (language-specific $a contains same info but). How about $3 and $6?
  // (During merge we might prefer language X $a fields but that does not concern us here.)
  const fields1 = record1.get(tag);
  const fields2 = record2.get(tag);

  if (fields1.length !== fields2.length) {
    nvdebug(`check33X: ${tag}: FAIL: size mismatch`);
    return false;
  }
  if (fields1.length === 0) {
    if (tag !== '338') { // 336 and 337 must always be present
      nvdebug(`check33X: Comparison result: ${tag} is empty`);
      return false;
    }
    // 338 is optional only for comps
    if (!isComponentPart(record1)) {
      return false;
    }
    return true;
  }
  // Remove crappy fields:
  const validFields1 = fields1.filter(field => isValid33X(field));
  const validFields2 = fields2.filter(field => isValid33X(field));
  if (validFields1.length !== fields1.length) { // Data was lost: abort
    return false;
  }
  // Compare 33X$b contents:
  return subfieldSetsAreEqual(validFields1, validFields2, 'b');
}

function check336(record1, record2) {
  return check33X(record1, record2, '336');
}

function check337(record1, record2) {
  return check33X(record1, record2, '337');
}

function check338(record1, record2) {
  return check33X(record1, record2, '338');
}

function check773(record1, record2) {
  // Currently we don't merge records if Viola-specific 973 fields are present.
  const blockerFields1 = record1.get('973');
  const blockerFields2 = record2.get('973');
  if (blockerFields1.length > 0 || blockerFields2.length > 0) {
    return false;
  }

  // Viola's multihosts are sometimes stored in non-standard 973 field.
  const fields1 = record1.get('773');
  const fields2 = record2.get('773');
  if (fields1.length === 0 || fields2.lenght === 0) {
    // I don't think 773 field should determine record preference
    return true;
  }
  // 773$w is so rare, that we don't need to cache these, do we?
  return fields1.every(field => noConflicts(field, fields2)) && fields2.every(field => noConflicts(field, fields1));

  function getRelevantSubfieldWValues(field) {
    return getSubfieldValues(field, 'w')
      .map(value => normalize773w(value))
      .filter(value => (/^\(FI-MELINDA\)[0-9]{9}$/u).test(value));
  }

  function noConflictBetweenWSubfields(fieldA, fieldB) {
    // Check that two fields agree.
    // 1. No conflicting $w subfields
    const wValuesA = getRelevantSubfieldWValues(fieldA);
    if (wValuesA.length === 0) {
      return true;
    }
    const wValuesB = getRelevantSubfieldWValues(fieldB);
    if (wValuesB.length === 0) {
      return true;
    }
    // 2. has conflict
    if (wValuesA.some(valueA => hasConflict(valueA, wValuesB)) || wValuesB.some(valueB => hasConflict(valueB, wValuesA))) {
      return false;
    }
    return true;

    function hasConflict(value, opposingValues) {
      return opposingValues.every(value2 => {
        // Identical IDs eg. "(FOO)BAR" in both records cause no issue:
        if (value === value2) {
          return false;
        }
        // However "(FOO)LORUM" and "(FOO)IPSUM" signal troubles.
        // (Theoretically LORUM might refer to a deleted record that has been replaced by/merged to IPSUM.)
        if (sameControlNumberIdentifier(value, value2)) {
          return true;
        }
        return false;
      });
    }

  }

  function noConflictBetweenSubfields(fieldA, fieldB, subfieldCode) {
    const g1 = getSubfieldValues(fieldA, subfieldCode);
    if (g1.length === 0) {
      return true;
    }
    const g2 = getSubfieldValues(fieldB, subfieldCode);
    if (g2.length === 0) {
      return true;
    }
    if (g1.length !== g2.length) {
      return false;
    }
    return g1.every(value => g2.includes(value)) && g2.every(value => g1.includes(value));
  }


  function noConflictBetweenTwoFields(fieldA, fieldB) {
    // Check that two fields agree.
    // 1. No conflicting $w subfields
    if (!noConflictBetweenWSubfields(fieldA, fieldB)) {
      nvdebug('773$w check failed');
      return false;
    }
    // 2. No conflicting $g subfields
    if (!noConflictBetweenSubfields(fieldA, fieldB, 'g')) {
      nvdebug('773$g check failed');
      return false;
    }
    // 3. No conflicting $q
    if (!noConflictBetweenSubfields(fieldA, fieldB, 'q')) {
      nvdebug('773$q check failed');
      return false;
    }
    nvdebug(`773OK: '${fieldToString(fieldA)}' vs '${fieldToString(fieldB)}'`);
    return true;

  }

  function noConflicts(field, opposingFields) {
    // Check that no opposing field causes trouble:
    nvdebug('noConflicts() in...');
    return opposingFields.every(otherField => noConflictBetweenTwoFields(field, otherField));
  }
}


function check005(record1, record2) {
  const fields1 = record1.get('005');
  const fields2 = record2.get('005');
  if (fields1.length !== 1 || fields2.length !== 1) { // corrupted shite
    return false;
  }
  // Theoretically the record with newer timestamp is the better one.
  // However, we have n+1 load-fixes etc reasons why this is not reliable, so year is good enough for me.
  const val1 = getYear(fields1[0]);
  const val2 = getYear(fields2[0]);
  if (val1 > val2) {
    return 'A';
  }
  if (val2 > val1) {
    return 'B';
  }
  return true;

  function getYear(field) {
    return parseInt(field.value.substr(0, 4), 10); // YYYY is approximate enough
  }
}


const comparisonTasks = [ // NB! These are/should be in priority order!
  {'description': 'existence (validation only)', 'function': checkExistence},
  {'description': 'leader (validation and priority)', 'function': checkLeader}, // Prioritize LDR/17 (encoding level)
  {'description': 'publisher (264>260) (priority only)', 'function': checkPublisher},
  {'description': 'LOW test (validation and priority)', 'function': checkLOW}, // Proprity order: FIKKA > ANY > NONE
  {'description': 'field 042: authentication code (priority only)', 'function': check042},
  // NB! I'd like to have a test for 008/06, but them specs for it are elusive?
  {'description': 'field 245 (title)', 'function': check245},
  {'description': 'field 336 (content type) test', 'function': check336},
  {'description': 'field 337 (media type) test', 'function': check337},
  {'description': 'field 338 (carrier type) test', 'function': check338},

  {'description': '773 $wgq test', 'function': check773},
  {'description': '040$b (language of cataloging) (priority only)', 'function': check040b},
  {'description': '040$e (description conventions) (priority only)', 'function': check040e},
  {'description': 'SID test (validation only)', 'function': checkSID}, // NB! JO used SID for priority as well
  {'description': '005 timestamp test (validation and priority)', 'function': check005}
];

// Apply some recursion evilness/madness/badness to perform only the tests we really really really want.
function runComparisonTasks(nth, record1, record2, checkPreference = true) {
  const currResult = comparisonTasks[nth].function(record1, record2, checkPreference);
  // NB! Aborts after a failure! No further tests are performed. Recursion means optimization :D
  if (nth === comparisonTasks.length - 1 || currResult === false) {
    return [currResult];
  }
  return [currResult].concat(runComparisonTasks(nth + 1, record1, record2, checkPreference));
}

function makeComparisons(record1, record2, checkPreference = true) {
  // Start with sanity check(s):
  if (comparisonTasks.length === 0) {
    return true;
  }
  // Get results (up to the point of first failure):
  const results = runComparisonTasks(0, record1, record2, checkPreference);
  // If any test fails, return false.
  if (results.length < comparisonTasks.length || results[results.length - 1] === false) {
    nvdebug(`makeComparisons() failed. Reason: ${comparisonTasks[results.length - 1].description}. (TEST: ${results.length}/${comparisonTasks.length})`);
    return {result: false, reason: `${comparisonTasks[results.length - 1].description} failed`};
  }

  if (!checkPreference) {
    return {result: true, reason: 'all tests passed'};
  }

  const decisionPoint = results.findIndex(val => val !== true && val !== false);
  if (decisionPoint === -1) {
    return {result: true, reason: 'both records passed all tests, but no winner was found'};
  }
  return {result: results[decisionPoint], reason: `${results[decisionPoint]} won ${comparisonTasks[decisionPoint].description}`};
}

// {Record, source, yms}
export default (recordA, recordB, checkPreference = true) => {
  // checkPreference should be multivalue:
  // X: NOT CHECK (current false), Y: CHECK MERGABILITY FOR HUMANS, Z: CHECK MERGABILITY FOR AUTOMATON (current true)
  //const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');

  //if (1) {
  // New version: Make checks only to the point of first failure...
  // console.log('ENTER THE PROGRAM');

  const result = makeComparisons(recordA, recordB, checkPreference);
  console.log(`Comparison result: ${result.result}, reason: ${result.reason}`); // eslint-disable-line no-console
  if (result.result === false) {
    return {action: false, prio: false, message: result.reason};
  }

  return {action: 'merge', prio: {'name': result.reason, 'value': result.result}};
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
