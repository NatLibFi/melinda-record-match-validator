/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2020-2021 University Of Helsinki (The National Library Of Finland)
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
import {collectRecordValues} from './collectRecordValues';
import {compareRecordValues} from './compareRecordValues';
import {validateCompareResults} from './validateRecordCompareResults';
import {normalize773w} from './collectFunctions/fields';

import {clone, isDeletedRecord} from '@natlibfi/melinda-commons';
import {getSubfieldValue, getSubfieldValues} from './collectFunctions/collectUtils';
//import debug from 'debug';
import {checkLeader} from './leader';
import {fieldHasSubfield, fieldToString, sameControlNumberIdentifier} from './utils';
//import {fieldStripPunctuation as stripPunctuation} from '../node_modules/@natlibfi/melinda-marc-record-merge-reducers/src/reducers/punctuation';
import {fieldStripPunctuation as stripPunctuation} from './punctuation';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');


function nvdebug(message) {
  debug(message);
  console.info(message);
}

function checkExistence(record1, record2, checkPreference = true) {
  if (record1 === undefined || record2 === undefined) {
    return false;
  }
  if (isDeletedRecord(record1) || isDeletedRecord(record2)) {
    return false;
  }
  return true;
}

const validValuesForSubfield = {
  '336‡b': ['prm', 'tdi', 'tdm', 'ntm', 'spw', 'sti', 'txt', 'snd'],
  '336‡2': ['rdacontent'],
  '337‡b': ['c', 'e', 'g', 'h', 'n', 'p', 's', 'v', 'x', 'z'],
  '337‡2': ['rdamedia'],
  '338‡b': [
    'ca',
    'cb',
    'cd',
    'ce',
    'cf',
    'ch',
    'ck',
    'cr',
    'cz',
    'eh',
    'es',
    'ez',
    'gc',
    'gd',
    'gf',
    'gs',
    'gt',
    'ha',
    'hb',
    'hc',
    'hd',
    'he',
    'hf',
    'hg',
    'hh',
    'hj',
    'hz',
    'mc',
    'mf',
    'mo',
    'mr',
    'mz',
    'na',
    'nb',
    'nc',
    'nn',
    'no',
    'nr',
    'nz',
    'pp',
    'pz',
    'sd',
    'ss',
    'st',
    'sz',
    'vc',
    'vd',
    'vf',
    'vr',
    'vz',
    'zu'
  ],
  '338‡2': ['rdacarrier']
};


function fieldGetNonRepeatableValue(field, subfieldCode) {
  //nvdebug(` fieldGetNonRepeatableValue('${fieldToString(field)}', '${subfieldCode}') in...`);
  const subfieldValues = getSubfieldValues(field, subfieldCode);
  if (subfieldValues.length !== 1) { // require exactly one instance exists
    nvdebug(`  ${field.tag}‡${subfieldCode}: ${subfieldValues.length} subfields found`);
    return null;
  }
  //nvdebug(JSON.stringify(subfields[0]));
  const key = `${field.tag}‡${subfieldCode}`;
  if (key in validValuesForSubfield) {
    if (!validValuesForSubfield[key].includes(subfieldValues[0])) {
      nvdebug(`  fieldGetNonRepeatableValue() return null ('${subfieldValues[0]}' not found in '${validValuesForSubfield[key].join('/')}')`);
      return null;
    }
  }
  //nvdebug(`  fieldGetNonRepeatableValue('${fieldToString(field)}', '${subfieldCode}') returns '${subfieldValues[0]}'`);
  return subfieldValues[0];
}


function fieldHasValidNonRepeatableSubfield(field, subfieldCode) {
  const uniqueValue = fieldGetNonRepeatableValue(field, subfieldCode);
  if (uniqueValue === null) {
    nvdebug(`fieldHasValidNonRepeatableSubfield() returns false`);
    return false;
  }
  //nvdebug(`fieldHasValidNonRepeatableSubfield() returns true`);
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

function subfieldSetsAreEqual(fields1, fields2, subfieldCode) {
  // Called by 33X$b (field having exactly one instance of $b is checked elsewhere)
  const subfieldValues1 = fields1.map(field => getSubfieldValue(field, subfieldCode));
  const subfieldValues2 = fields2.map(field => getSubfieldValue(field, subfieldCode));
  //nvdebug("SSAE1: '"+subfieldValues1.join("' - '")+"'");
  //nvdebug("SSAE2: '"+subfieldValues2.join("' - '")+"'");
  return subfieldValues1.every((value, index) => value === subfieldValues2[index]);
}

function check040b(record1, record2, checkPreference = true) {
  const score1 = recordScore040FieldLanguage(record1);
  const score2 = recordScore040FieldLanguage(record2);
  nvdebug(`040$b scores: ${score1} vs ${score2}`);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }

  function recordScore040FieldLanguage(record) {
    const fields = record.get('040');
    if (fields.length !== 1) {
      return 0;
    }
    return score040SubfieldBValues(getSubfieldValues(fields[0], 'b'));
  }

  function score040SubfieldBValues(values) {
    if (values.length !== 1) {
      return 0;
    }
    if (values[0] === 'fin') {
      return 4;
    }
    if (values[0] === 'swe') {
      return 3;
    } // Tack och förlåt
    if (values[0] === 'mul') {
      return 2;
    } // Comes definite
    // Now now. Should we assume that no 040$b is better than, say, 040$b eng? We do assume so...
    return -1;
  }

  return true; // This test does not fail
}

function check040e(record1, record2, checkPreference = true) {
  const score1 = recordScore040FieldDescriptionConvention(record1);
  const score2 = recordScore040FieldDescriptionConvention(record2);
  nvdebug(`040$e scores: ${score1} vs ${score2}`);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }

  function recordScore040FieldDescriptionConvention(record) {
    const fields = record.get('040');
    if (fields.length !== 1) {
      return 0;
    }
    return score040SubfieldEValues(getSubfieldValues(fields[0], 'e'));
  }

  function score040SubfieldEValues(values) {
    if (values.length !== 1) {
      return 0;
    }
    if (values.includes('rda')) {
      return 1;
    }
    // Now now... Should we assume that no 040$e is better than, say, 040$e FFS?
    // We take no sides, return same score for both, and hope that some other rule makes a good decision for us.
    return 0;
  }

  return true; // This test does not fail
}

function check042(record1, record2, checkPreference = true) {
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

function check245(record1, record2, checkPreference = true) {
  // Get both 245 fields and remove punctuation for easier comparisons:

  const fields1 = record1.get('245');
  const fields2 = record2.get('245');
  if (fields1.length !== 1 || fields2.length !== 1) {
    return false;
  }
  
  // NB! punctuation removal code has not been perfectly tested yet, and it does not cover all fields yet.
  // So test and test...

  const clone1 = stripPunctuation(clone(fields1[0])); //stripPunctuation(clone(fields1[0]));
  const clone2 = stripPunctuation(clone(fields2[0]));
  //return true;
  nvdebug(fieldToString(clone1));
  nvdebug(fieldToString(clone2));
  // a b c

  return true;
}

function check33X(record1, record2, tag, checkPreference = true) {
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

function check336(record1, record2, checkPreference = true) {
  return check33X(record1, record2, '336', checkPreference);
}

function check337(record1, record2, checkPreference = true) {
  return check33X(record1, record2, '337', checkPreference);
}

function check338(record1, record2, checkPreference = true) {
  return check33X(record1, record2, '338', checkPreference);
}

function check773(record1, record2, checkPreference = true) {
  // Viola's multihosts are sometimes stored in non-standard 973 field.
  const fields1 = record1.get('[79]73');
  const fields2 = record2.get('[79]73');
  if (fields1.length === 0 || fields2.lenght === 0) {
    // I don't think 773 field should determine record preference
    return true;
  }
  // 773$w is so rare, that we don't need to cache these, do we?
  // I think noConflicts is transitive...
  return fields1.every(field => noConflicts(field, fields2));

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

function checkLOW(record1, record2, checkPreference = true) {
  const fields1 = record1.get('LOW');
  const fields2 = record2.get('LOW');
  const score1 = lowFieldsToScore(fields1);
  const score2 = lowFieldsToScore(fields2);
  nvdebug(`LOW scores: ${score1} vs ${score2}`);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }
  return true;

  function lowFieldsToScore(fields) {
    return Math.max.apply(Math, fields.map(field => lowFieldToScore(field)));
  }

  function lowFieldToScore(field) {
    const value = getSubfieldValue(field, 'a');
    if (!value) {
      return 0;
    }
    if (value === 'FIKKA') {
      return 10;
    }
    return 0;
  }
}
// array.some(...) returns false on

function checkSID(record1, record2, checkPreference = true) {
  const fields1 = record1.get('SID');
  const fields2 = record2.get('SID');
  // array.some(...) returns false on empty arrays... Handle them first:
  if (fields1.length === 0 || fields2.length === 0) {
    // NB! JO has preference rules as well. I don't think they are meaningful...
    return true;
  }

  // SID's $b subfield contains information about the owning organization.
  if (!fields1.some(field => isMergableSID(field, fields2)) || !fields2.some(field => isMergableSID(field, fields1))) {
    return false;
  }
  return true;

  function isMergableSID(sidField, otherSidFields) {
    const subfieldBValue = getSubfieldValue(sidField, 'b');
    const subfieldCValue = getSubfieldValue(sidField, 'c');
    if (!subfieldBValue || !subfieldCValue) { // Data corruption
      return false;
    }

    const counterpartFields = otherSidFields.filter(otherField => fieldHasSubfield(otherField, 'b', subfieldBValue));
    if (counterpartFields.length === 0) {
      return true;
    }
    if (counterpartFields.length > 1) { // This is mainly a sanity check
      return false;
    }
    return subfieldCValue === getSubfieldValue(counterpartFields[0], 'c');  }
}

const comparisonTasks = [ // NB! There/should are in priority order!
  {'description': 'existence (validation only)', 'function': checkExistence},
  {'description': 'leader (validation and priority)', 'function': checkLeader}, // Prioritize LDR/17 (encoding level)
  {'description': 'SID test (validation only)', 'function': checkSID}, // NB! JO used SID for priority as well
  {'description': 'LOW test (priority only)', 'function': checkLOW}, // NB! JO used LOW for priority as well
  {'description': 'field 042: authentication code (priority only)', 'function': check042},
  // TODO: add test for 008/06
  {'description': 'field 245 (title)', 'function': check245},
  {'description': 'field 336 (content type) test', 'function': check336},
  {'description': 'field 337 (media type) test', 'function': check337},
  {'description': 'field 338 (carrier type) test', 'function': check338},

  {'description': '773 $wgq test', 'function': check773},
  {'description': '040$b (language of cataloging) (priority only)', 'function': check040b},
  {'description': '040$e (description conventions) (priority only)', 'function': check040e}
  // TODO: add test for 005: if one of the records is considerably older than the other one, use the newer one.
  // However, since automatic fixes modify 005, new 005 does not imply too much...
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
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');
  if (1) {
    // New version: Make checks only to the point of first failure...
    console.log('ENTER THE PROGRAM');

    const result = makeComparisons(recordA, recordB, checkPreference);
    console.log(`Comparison result: ${result.result}, reason: ${result.reason}`);
    if (result.result === false) {
      return {action: false, prio: false, message: result.reason};
    }

    return {action: 'merge', prio: {'name': result.reason, 'value': result.result}};
  }
  // We never here...
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

};
