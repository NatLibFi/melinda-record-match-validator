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
import {mapTypeOfRecord, mapBibliographicalLevel, mapEncodingLevel} from './collectFunctions/leader';
import {compareRecordCompletionLevel as compareEncodingLevel}  from './compareFunctions/leader';

//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');

/*
export function validateFailure(comparedRecordValues) {


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

const comparisonTasks = [
  { 'description': 'existence test', 'function': checkExistence },
  { 'description': 'leader test', 'function': checkLeader }
]

// Apply some recursion evilness/madness/badness to perform only the tests we really really really want.
function runComparisonTasks(nth, record1, record2, checkPreference = true) {
  const currResult = comparisonTasks[nth].function(record1, record2, checkPreference);
  // NB! Aborts after a failure!
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
    return { result: false, reason: comparisonTasks[results.length-1].description + ' test failed' };
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
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');
  /*
  console.log("ENTER THE PROGRAM");
  const result = makeComparisons(recordA, recordB, checkPreference);
  console.log(`Result: ${result.result}, reason: ${result.reason}`);
  if ( result.result === false ) {
    return {action: false, prio: false, message: result.reason };
  }

  return {action: 'merge', prio: { "name": result.reason, "value" : result.result }};
  */

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
