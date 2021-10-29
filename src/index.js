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
import {collectRecordValues} from './collectRecordValues';
import {compareRecordValues} from './compareRecordValues';
import {validateCompareResults} from './validateRecordCompareResults';


import {isDeletedRecord} from '@natlibfi/melinda-commons';
import {getSubfieldValue, getSubfieldValues} from './collectFunctions/collectUtils';
import {mapTypeOfRecord, mapBibliographicalLevel, mapEncodingLevel} from './collectFunctions/leader';
import {compareRecordCompletionLevel as compareEncodingLevel}  from './compareFunctions/leader';
import debug from 'debug';

//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');

/*
export function validateFailure(comparedRecordValues) {

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

  if (!comparedRecordValues['773']) {
    // Fixed a bug here. At least no 773 combo did not work.
    // NB! Check whether 773 combos work.
    const message = 'Host item entries (773) mismatch'
    debug(message);
    return {failure: true, reason: message, field: '773'};
  }

  return {failure: false};
}
*/

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

function getTypeOfRecord(record) {
  const description = mapTypeOfRecord(record.leader[6]); // Will trigger error, if value is invalid
  if (description) {
    return description.code;
  }
  return null;
}

function getBibliographicalLevel(record) {
  const description = mapBibliographicalLevel(record.leader[7]); // Will trigger error, if value is invalid
  if (description) {
    return description.code;
  }
  return null;
}

function getEncodingLevel(record) {
  const description = mapEncodingLevel(record.leader[17]); // Will trigger error, if value is invalid
  if (description) {
    return description.code;
  }
  return null;
}

function checkLeader(record1, record2, checkPreference = true) {
  // type of record:
  if (getTypeOfRecord(record1) !== getTypeOfRecord(record2)) {
    return false;
  }
  // bibliographical level:
  if ( getBibliographicalLevel(record1) !== getBibliographicalLevel(record2) ) { return false; }
  // encoding level
  // NB! We check the encoding level even with checkPreference===false, since it checks for legal values
  const encodingLevelPreference = compareEncodingLevel(getEncodingLevel(record1), getEncodingLevel(record2));
  if ( checkPreference ) { return encodingLevelPreference; }
  return ( encodingLevelPreference === false ? false : true );
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
  nvdebug(`  fieldGetNonRepeatableValue('${fieldToString(field)}', '${subfieldCode}') returns '${subfieldValues[0]}'`);
  return subfieldValues[0];
}



function fieldHasValidNonRepeatableSubfield(field, subfieldCode) {
  const uniqueValue = fieldGetNonRepeatableValue(field, subfieldCode);
  if (uniqueValue === null) {
    nvdebug(`fieldHasValidNonRepeatableSubfield() returns false`);
    return false;
  }
  nvdebug(`fieldHasValidNonRepeatableSubfield() returns true`);
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
  nvdebug("SSAE1: '"+subfieldValues1.join("' - '")+"'");
  nvdebug("SSAE2: '"+subfieldValues2.join("' - '")+"'");
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

const comparisonTasks = [
  { 'description': 'existence test', 'function': checkExistence },
  { 'description': 'leader test', 'function': checkLeader },
  { 'description': 'field 336 (content type) test', 'function': check336 },
  { 'description': 'field 337 (media type) test', 'function': check337 },
  { 'description': 'field 338 (carrier type) test', 'function': check338 }
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
