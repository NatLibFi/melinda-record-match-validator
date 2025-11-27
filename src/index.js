import createDebugLogger from 'debug';
import {comparisonTasksTable} from './comparisonTasks.js';
import {check984} from './compareFunctions/compareField984.js';
import {MarcRecord} from '@natlibfi/marc-record';
import {nvdebug} from './utils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

// Apply some recursion evilness/madness/badness to perform only the tests we really really really want.
function runComparisonTasks({nth, record1, record2, checkPreference = true, record1External = {}, record2External = {}, returnAll = false, comparisonTasks = comparisonTasksTable.recordImport}) {

  // DEVELOP: We could skip those tasks that are !validation if !checkPreference - but how?

  const currResult = comparisonTasks[nth].function({record1, record2, checkPreference, record1External, record2External});
  // NB! Aborts after the last task or after a failure (meaning currResult === false)! No further tests are performed. Recursion means optimization :D
  debugDev(`Running task ${nth} (${comparisonTasks[nth].name}) - returnAll: ${returnAll}`);
  if (nth === comparisonTasks.length - 1 || (!returnAll && currResult === false)) {
    return [currResult];
  }
  return [currResult].concat(runComparisonTasks({nth: nth + 1, record1, record2, checkPreference, record1External, record2External, returnAll, comparisonTasks}));
}

function makeComparisons({record1, record2, checkPreference = true, record1External = {}, record2External = {}, returnAll = false, comparisonTasks = comparisonTasksTable.recordImport}) {
  debugDev(`returnAll: ${returnAll}`);

  // Start with sanity check(s): if there are no tasks, it is not a failure:
  if (comparisonTasks.length === 0) {
    const resultForZeroTasks = {result: true, reason: `No rules defined`};
    if (returnAll) {
      return [resultForZeroTasks];
    }
    return resultForZeroTasks;
  }

  // Get results (if not returnAll, just up to the point of first failure):
  const results = runComparisonTasks({nth: 0, record1, record2, checkPreference, record1External, record2External, returnAll, comparisonTasks});

  return returnAll ? returnAllResults() : returnDecisionPointResult();

  // return array of all comparison task results
  function returnAllResults() {
    const allResults = results.map((result, i) => ({
      result,
      reason: comparisonTasks[i].name,
      preference: comparisonTasks[i].preference,
      validation: comparisonTasks[i].validation,
      level: comparisonTasks[i].manual === undefined ? 'error' : comparisonTasks[i].manual,
      validation_message_fi: comparisonTasks[i].validation_message_fi,
      preference_message_fi: comparisonTasks[i].preference_message_fi
    }));

    if (checkPreference) {
      // Add f984 overide result (check preference override from records f984)
      const field984OverrideResult = getField984OverrideResult();
      if (field984OverrideResult) {
        return allResults.concatenate(field984OverrideResult);
      }
      return allResults;
    }
    return allResults;

  }

  // return result from the decision point where first task fails
  function returnDecisionPointResult() {

    // If we do not want all results, if any of tests fails, return false and description for failing test
    if (results.length < comparisonTasks.length || results[results.length - 1] === false) {
      nvdebug(`makeComparisons() failed. Reason: ${comparisonTasks[results.length - 1].description}. (TEST: ${results.length}/${comparisonTasks.length})`, debugDev);
      return {result: false, reason: `${comparisonTasks[results.length - 1].description} failed`};
    }

    if (!checkPreference) {
    // This will also skip separate field 984 check
      return {result: true, reason: 'all tests passed'};
    }

    // Let's do extra check for preference override in records
    const field984OverrideResult = getField984OverrideResult();
    if (field984OverrideResult) {
      return field984OverrideResult;
    }

    const decisionPoint = results.findIndex(val => val !== true && val !== false);
    if (decisionPoint === -1) {
      return {result: true, reason: 'both records passed all tests, but no winner was found'};
    }
    return {result: results[decisionPoint], reason: `${results[decisionPoint]} won ${comparisonTasks[decisionPoint].description}`};
  }

  // We get a separate override result, because normal preference checks find first preference
  function getField984OverrideResult() {
    const field984Override = check984({record1, record2});
    if (field984Override === 'A' || field984Override === 'B') {
      return {result: field984Override, reason: 'Field 984 override applied (MRA-744)'};
    }
    return;
  }
}

// record1External/record2External includes external information for record (for example whether it is an incomingRecord or databaseRecord)
// MergeUI is currently used for manual merging of two database records
// Returns array of failure responses, empty array if matchValidator does not return failures
// [{ "result": "error/warning", "type": "validation/preference", "message": "finnish message"}]

export function matchValidationForMergeUi({record1Object, record2Object, checkPreference = true, record1External = {'recordSource': 'databaseRecord'}, record2External = {'recordSource': 'databaseRecord'}, manual = true, comparisonTasks = comparisonTasksTable.humanMerge}) {
  debugDev(`Manual ${manual} (for Merge UI) - we have ${comparisonTasks.length} comparison tasks`);
  debugDev(`FOOBAR`);
  // Create MarcRecords here to avoid problems with differing MarcRecord versions etc.
  const record1 = new MarcRecord(record1Object, {subfieldValues: false});
  const record2 = new MarcRecord(record2Object, {subfieldValues: false});

  const result = makeComparisons({record1, record2, checkPreference, record1External, record2External, returnAll: true, comparisonTasks});
  debugDev(JSON.stringify(result));
  // return result-array failed results
  const resultForMergeUi = filterResultsForMergeUI(result);
  return resultForMergeUi;

  // Return to Merge UI only results that require action, ie. those that fail merge or change preference
  // MergeUI sends records non-preferred record as record1 and preferred record as record2, so preference result 'A' is a warning
  function filterResultsForMergeUI(allResults) {
    const failure = allResults
      .filter(r => r.result !== true) // Filter out passed tests
      .filter(r => r.result !== 'B'); // Filter out passed preference tests (record2/B is preferred)
    debugDev(`MatchValidator failed: ${JSON.stringify(failure, null, 4)}`);

    const messages = failure
      .map(({result, level, validation_message_fi, preference_message_fi}) => ({
        result: result === 'A' ? 'warning' : level, // all preference-results are warning in UI
        type: result === 'A' ? 'preference' : 'validation', //
        message: result === 'A' ? preference_message_fi : validation_message_fi
      })); // Convert to messages
    debugDev(`MatchValidator results for MergeUI: ${JSON.stringify(messages, null, 4)}`);

    return messages;
  }
}

// record1External/record2External includes external information for record (for example whether it is an incomingRecord or databaseRecord)
export default ({record1Object, record2Object, checkPreference = true, record1External = {}, record2External = {}, manual = false, comparisonTasks = comparisonTasksTable.recordImport}) => {
  debugDev(`Default (manual: ${manual}) (for record import) we have ${comparisonTasks.length} comparison tasks`);
  // Create MarcRecords here to avoid problems with differing MarcRecord versions etc.
  const record1 = new MarcRecord(record1Object, {subfieldValues: false});
  const record2 = new MarcRecord(record2Object, {subfieldValues: false});

  const result = makeComparisons({record1, record2, checkPreference, record1External, record2External, comparisonTasks});
  debug(`Comparison result: ${result.result}, reason: ${result.reason}`);

  if (result.result === false) {
    return {action: false, preference: false, message: result.reason};
  }

  return {action: 'merge', preference: {'name': result.reason, 'value': result.result}};
};
