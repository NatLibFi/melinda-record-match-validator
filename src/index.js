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
import {normalize773w} from './collectFunctions/fields'

import {isDeletedRecord} from '@natlibfi/melinda-commons';
import {getSubfieldValue, getSubfieldValues} from './collectFunctions/collectUtils';
import debug from 'debug';
import {checkLeader} from './leader';
//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');



function fieldToString(f) {
  if ('subfields' in f) {
    return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;
  }
  return `${f.tag}    ${f.value}`;
  function formatSubfields(field) {
    return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
  }
}


function nvdebug(message) {
  debug(message);
  console.info(message);
}

function checkExistence(record1, record2, checkPreference = true) {
  if ( record1 === undefined || record2 === undefined ) { return false; }
  if ( isDeletedRecord(record1) || isDeletedRecord(record2) ) { return false; }
  return true;
}

const validValuesForSubfield = {
  '336‡b' : ['prm', 'tdi', 'tdm', 'ntm', 'spw', 'sti', 'txt', 'snd'],
  '336‡2' : ['rdacontent'],
  '337‡b' : ['c', 'e', 'g', 'h', 'n', 'p', 's', 'v', 'x', 'z'],
  '337‡2' : ['rdamedia'],
  '338‡b' : ['ca', 'cb', 'cd', 'ce', 'cf', 'ch', 'ck', 'cr', 'cz',
    'eh', 'es', 'ez',
    'gc', 'gd', 'gf', 'gs', 'gt',
    'ha', 'hb', 'hc', 'hd', 'he', 'hf', 'hg', 'hh', 'hj', 'hz',
    'mc', 'mf', 'mo', 'mr', 'mz',
    'na', 'nb', 'nc', 'nn', 'no', 'nr', 'nz',
    'pp', 'pz',
    'sd', 'ss', 'st', 'sz',
    'vc', 'vd', 'vf', 'vr', 'vz',
    'zu' ],
  '338‡2' : ['rdacarrier']
}



function fieldGetNonRepeatableValue(field, subfieldCode) {
  //nvdebug(` fieldGetNonRepeatableValue('${fieldToString(field)}', '${subfieldCode}') in...`);
  const subfieldValues = getSubfieldValues(field, subfieldCode);
  if ( subfieldValues.length !== 1 ) { // require exactly one instance exists
    nvdebug(`  ${field.tag}‡${subfieldCode}: ${subfieldValues.length} subfields found`);
    return null;
  }
  //nvdebug(JSON.stringify(subfields[0]));
  const key = field.tag+'‡'+subfieldCode;
  if (key in validValuesForSubfield){
    if(!validValuesForSubfield[key].includes(subfieldValues[0])) {
      nvdebug(`  fieldGetNonRepeatableValue() return null ('${subfieldValues[0]}' not found in '${validValuesForSubfield[key].join("/")}')`);
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
function isComponentPart(record) {
  if (['a', 'b', 'd'].includes(record.getBibliographicalLevel)) {
    return true;
  }
  // Should having a 773 (or 973) field imply that record is a component part?
  return false;
}

function isValid33X(field) {
  if (!['336', '337', '338'].includes(field.tag)){
    return false;
  }
  if (!['a', 'b', '2'].every(subfieldCode => fieldHasValidNonRepeatableSubfield(field, subfieldCode))) {
    return false;
  }
  // We might have some control subfield checks here?!?
  return true;
}

function arraysAreEqualAfterSorting(array1, array2) {
  if (array1.length !== array2.length) {
    nvdebug(` arraysAreEqualAfterSorting(): array size mismatch ${array1.length} vs ${array2.length}`);
    return false; 
  }

  var sortedArray1 = array1.sort();
  var sortedArray2 = array2.sort();
  if (sortedArray1.every((value, index) => value === array2[index])) {
    nvdebug(` arraysAreEqualAfterSorting(): arrays match`);
    //nvdebug("SA1: '"+sortedArray1.join("' - '")+"'");
    //nvdebug("SA2: '"+sortedArray2.join("' - '")+"'");
    return true;
  }
  nvdebug(` arraysAreEqualAfterSorting(): arrays don't match`);
  //nvdebug("SA1: '"+sortedArray1.join("' - '")+"'");
  //nvdebug("SA2: '"+sortedArray2.join("' - '")+"'");
  return false;
}

function subfieldSetsAreEqual(fields1, fields2, subfieldCode) {
  // Called by 33X$b (field having exactly one instance of $b is checked elsewhere)
  const subfieldValues1 = fields1.map(field => getSubfieldValue(field, subfieldCode));
  const subfieldValues2 = fields2.map(field => getSubfieldValue(field, subfieldCode));
  //nvdebug("SSAE1: '"+subfieldValues1.join("' - '")+"'");
  //nvdebug("SSAE2: '"+subfieldValues2.join("' - '")+"'");
  return subfieldValues1.every((value, index) => value === subfieldValues2[index]);
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
  if (fields1.length === 0 ) {
    if (tag !== '338') { // 336 and 337 must always be present
      nvdebug(`check33X: Comparison result: ${tag} is empty`);
      return false;
    }
    // 338 is optional only for comps
    if ( !isComponentPart(record1)) {
      return false;
    }
    return true;
  }
  // Remove crappy fields:
  const validFields1 = fields1.filter(field => isValid33X(field));
  const validFields2 = fields2.filter(field => isValid33X(field));
  if (validFields1.length !== fields1.length ) { // Data was lost: abort
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
  if ( fields1.length === 0 || fields2.lenght === 0 ) {
    // I don't think 773 field should determine record preference
    return true;
  }
  // 773$w is so rare, that we don't need to cache these, do we?
  // I think noConflicts is transitive...
  return fields1.every(field => noConflicts(field, fields2));

  function getRelevantSubfieldWValues(field) {
    return getSubfieldValues(field, 'w')
    .map(value => normalize773w(value))
    .filter(value => /^\(FI-MELINDA\)[0-9]{9}$/u.test(value));
  }

  function stripControlNumberPart(id) {
    // return "(FOO)" from "(FOO)BAR"
    if ( /^\([^\)]+\)[0-9]+$/u.test(id) ) {
      return id.substr(0, id.indexOf(')')+1);
    }
    return null; // Not exactly sure what failure should return...
  }


  function noConflictBetweenTwoIds(id1, id2) {
    if ( id1 === id2 ) { return true; } // eg. "(FOO)BAR" === "(FOO)BAR"
    if ( stripControlNumberPart(id1) === stripControlNumberPart(id2) ) {
      nvdebug(`ID check failed '${id1}' vs '${id2}`);
      return false;
    } // "(FOO)LORUM" vs "(FOO)IPSUM"
    return true; // IDs come from different databases
  }

  function noConflictBetweenWSubfields(fieldA, fieldB) {
    // Check that two fields agree.
    // 1. No conflicting $w subfields
    const wValuesA = getRelevantSubfieldWValues(fieldA);
    if ( wValuesA.length === 0 ) { return true; }
    const wValuesB = getRelevantSubfieldWValues(fieldB);
    if ( wValuesB.length === 0 ) { return true; }
    if (!wValuesA.every(valueA => wValuesB.every(valueB => noConflictBetweenTwoIds(valueA, valueB))) || !wValuesB.every(valueB => wValuesA.every(valueA => noConflictBetweenTwoIds(valueA, valueB)))){
      return false;
    }
    return true;
  }

  function noConflictBetweenSubfields(fieldA, fieldB, subfieldCode) {
    const g1 = getSubfieldValues(fieldA, subfieldCode);
    if ( g1.length === 0 ) { return true; }
    const g2 = getSubfieldValues(fieldB, subfieldCode);
    if ( g2.length === 0 ) { return true; }
    if ( g1.length !== g2.length ) { return false; }
    return g1.every(value => g2.includes(value)) && g2.every(value => g1.includes(value));
  }


  function noConflictBetweenTwoFields(fieldA, fieldB) {
    // Check that two fields agree. 
    // 1. No conflicting $w subfields
    if ( !noConflictBetweenWSubfields(fieldA, fieldB)) {
      nvdebug("773$w check failed");
      return false;
    }
    // 2. No conflicting $g subfields
    if ( !noConflictBetweenSubfields(fieldA, fieldB, 'g')) {
      nvdebug("773$g check failed");
      return false;
    }
    // 3. No conflicting $q
    if ( !noConflictBetweenSubfields(fieldA, fieldB, 'q')) {
      nvdebug("773$q check failed");
      return false;
    }
    nvdebug(`773OK: '${fieldToString(fieldA)}' vs '${fieldToString(fieldB)}'`);
    return true;

  }

  function noConflicts(field, opposingFields) {
    // Check that no opposing field causes trouble:
    nvdebug("noConflicts() in...")
    return opposingFields.every(otherField => noConflictBetweenTwoFields(field, otherField));
  }
}

function checkSID(record1, record2, checkPreference = true) {
  const fields1 = record1.get('SID');
  const fields2 = record2.get('SID');
  // array.some(...) returns false on empty arrays... Handle them first:
  if ( fields1.length === 0 || fields2.length === 0) {
    return true;
  }
  // SID's $b contains owner info
  if ( !fields1.some(field => isMergableSID(field, fields2)) || !fields2.some(field => isMergableSID(field, fields1))) {
    return false;
  }
  return true;

  function isMergableSID(sidField, otherSidFields) {
    const subfieldB = getSubfieldValue(sidField, 'b');
    if (!subfieldB) { return false; }
    if ( otherSidFields.some(sidField2 => {
      const subfieldB2 = getSubfieldValue(sidField2, 'b');
      if (!subfieldB2) { return false; }
      if (subfieldB === subfieldB2) {
        // However, it might be ok, if SID$c subfields are equal as well!?!
        return true;
      }
      return false;
    })) {
      return false;
    }
    return true;
  }
}

const comparisonTasks = [
  { 'description': 'existence test', 'function': checkExistence },
  { 'description': 'leader test', 'function': checkLeader },
  // TODO: add test for 008/06
  { 'description': 'field 336 (content type) test', 'function': check336 },
  { 'description': 'field 337 (media type) test', 'function': check337 },
  { 'description': 'field 338 (carrier type) test', 'function': check338 },
  { 'description': 'SID test', 'function': checkSID},
  { 'description': '773 $wgq test', 'function': check773 }
];

// Apply some recursion evilness/madness/badness to perform only the tests we really really really want.
function runComparisonTasks(nth, record1, record2, checkPreference = true) {
  const currResult = comparisonTasks[nth].function(record1, record2, checkPreference);
  // NB! Aborts after a failure! No further tests are performed. Recursion means optimization :D
  if ( nth === comparisonTasks.length-1 || currResult === false ) { return [ currResult ]; }
  return [ currResult ].concat(runComparisonTasks(nth+1, record1, record2, checkPreference));
}

function makeComparisons(record1, record2, checkPreference = true) {
  // Start with sanity check(s):
  if ( comparisonTasks.length == 0 ) { return true; }
  // Get results (up to the point of first failure):
  const results = runComparisonTasks(0, record1, record2, checkPreference);
  // If any test fails, return false.
  if ( results.length < comparisonTasks.length || results[results.length-1] === false ) {
    nvdebug(`makeComparisons() failed. Reason: ${comparisonTasks[results.length-1].description}. (TEST: ${results.length}/${comparisonTasks.length})`);
    return { result: false, reason: comparisonTasks[results.length-1].description + ` failed`};
  }

  if ( !checkPreference ) {
    return { result: true, reason: 'all tests passed' };
  }

  const decisionPoint = results.findIndex(val => val !== true && val !== false);
  if ( decisionPoint == -1 ) {
    return { result: true, reason: 'both records passed all tests, but no winner was found' };
  }
  return { result: results[decisionPoint], reason: results[decisionPoint] + ' won ' + comparisonTasks[decisionPoint].description };
}

// {Record, source, yms}
export default (recordA, recordB, checkPreference = true) => {
  // checkPreference should be multivalue:
  // X: NOT CHECK (current false), Y: CHECK MERGABILITY FOR HUMANS, Z: CHECK MERGABILITY FOR AUTOMATON (current true)
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');
  if ( 1 ) {
    // New version: Make checks only to the point of first failure...
    console.log("ENTER THE PROGRAM");
  
    const result = makeComparisons(recordA, recordB, checkPreference);
    console.log(`Comparison result: ${result.result}, reason: ${result.reason}`);
    if ( result.result === false ) {
      return {action: false, prio: false, message: result.reason };
    }

    return {action: 'merge', prio: { "name": result.reason, "value" : result.result }};
  }

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
