
import createDebugLogger from 'debug';
import {isDeletedRecord, isTestRecord, isComponentRecord} from '@natlibfi/melinda-commons';
import {MarcRecord} from '@natlibfi/marc-record';

import {checkSID} from './fieldSID';
import {checkLOW, checkLOWinternal} from './fieldLOW';
import {checkCAT} from './fieldCAT';
import {check040b, check040e} from './field040';
//import {check245} from './field245';
import {checkAllTitleFeatures} from './title';
import {checkPublisher} from './field26X';
//import {getSubfieldValues} from './collectFunctions/collectUtils';
//import {collectRecordValues} from './collectRecordValues';
//import {compareRecordValues} from './compareRecordValues';
//import {validateCompareResults} from './validateRecordCompareResults';
import {check042} from './field042';
import {check336, check337, check338} from './field33X';
import {check773} from './field773';
import {check984} from './field984';
import {checkLeader, checkTypeOfRecord, checkRecordLevel} from './leader';
import {check005, check008} from './controlFields';
import {compareRecordsPartSetFeatures} from './partsAndSets';
import {performAudioSanityCheck} from './sanityCheckAudio';
import {performDaisySanityCheck} from './sanityCheckDaisy';
import {performDvdSanityCheck} from './sanityCheckDvd';
import {performIsbnQualifierCheck} from './sanityCheckIsbnQualifer';
import {nvdebug} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:index');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

function checkExistence({record1, record2}) {
  if (record1 === undefined || record2 === undefined) {
    return false;
  }
  if (isDeletedRecord(record1) || isDeletedRecord(record2)) {
    return false;
  }
  return true;
}

function checkTestRecord({record1, record2}) {
  if (isTestRecord(record1) !== isTestRecord(record2)) {
    return false;
  }
  return true;
}

function checkHostComponent({record1, record2}) {
  if (isComponentRecord(record1, false, ['973']) !== isComponentRecord(record2, false, ['973'])) {
    return false;
  }
  return true;
}

const originalComparisonTasks = [ // NB! These are/should be in priority order!
  // undefined or deleted records cannot be merged (both automatic and human merge)
  {'name': 'existence',
    'description': 'existence (validation only)',
    'function': checkExistence,
    'validation': true,
    'preference': false,
    'preference_message_fi': '',
    'validation_message_fi': 'poistettuja tietueita ei voi yhdistää'},

  // test records and non test records should not be merged
  {'name': 'test record',
    'description': 'test record',
    'function': checkTestRecord,
    'validation': true,
    'preference': false,
    'preference_message_fi': '',
    'validation_message_fi': 'testitietuetta ja normaalia tietuetta ei voi yhdistää'},

  // test records and non test records should not be merged
  {'name': 'host/component',
    'description': 'host/component record',
    'function': checkHostComponent,
    'validation': true,
    'preference': false,
    'preference_message_fi': '',
    'validation_message_fi': 'osakohdetta ja ei-osakohdetta ei voi yhdistää'},

  // checks record type LDR/06 && bibliographic level LDR/07 (validation) and LDR/17 for encoding level (preference)s
  // - fail merge if LDR/006-7 are mismatch
  // - preference based on encoding level and more nuanced prepublication level for prepub records
  // Prioritize LDR/17 (encoding level)
  // DEVELOP: we'll need more nuanced check for human merge:
  //          record type & specific bibliographic level can be warnings,
  //          generic non-component / component difference should prevent merge
  //          we should currently be able to block merge for records that *have* components, but that needs Melinda-search or f774, so...
  {'name': 'leader',
    'description': 'leader (validation and preference)',
    'function': checkLeader,
    'validation': true,
    'preference': true,
    'manual': false,
    'validation_message_fi': 'ainestotyypiltään tai bibliografiselta tasoltaan eroavia tietueita ei voi yhdistää',
    'preference_message_fi': 'suosi koodaus- ja ennakkotietotasoltaan parempaa tietuetta'},

  // leader typeOfRecord LDR/006
  // do not use same time as checkLeader that checks all three leader values
  {'name': 'typeOfRecord',
    'description': 'leader: typeOfRecord (validation)',
    'function': checkTypeOfRecord,
    'validation': true,
    'preference': false,
    'manual': 'warning',
    'import': false,
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, ne eroavat ainestotyypiltään; yhdistettyäsi tarkista kentän 008 merkkipaikkojen arvot',
    'preference_message_fi': ''},

  // leader bibliographicLevel LDR/006
  // do not use same time as checkLeader that checks all three leader values
  {'name': 'bibliographicLevel',
    'description': 'leader: bibliographicLevel (validation)',
    'function': checkTypeOfRecord,
    'validation': true,
    'preference': false,
    'import': false,
    'manual': 'error',
    'validation_message_fi': 'bibliografiselta tasoltaan eroavia tietueita ei voi yhdistää',
    'preference_message_fi': ''},

  // leader encodingLevel LDR/017 + f500/f594
  // do not use same time as checkLeader that checks all three leader values
  {'name': 'recordLevel',
    'description': 'leader + 500/594: recordLevel (preference)',
    'function': checkRecordLevel,
    'validation': false,
    'preference': true,
    'import': false,
    'manual': 'warning',
    'validation_message_fi': '',
    'preference_message_fi': 'suosi koodaus- ja ennakkotietotasoltaan parempaa tietuetta'},

  // just preference also for human merge (we like records with 264 instead of 260, they are probably more RDA-compatible)
  // Bit high on the preference list, isn't it?
  {'name': 'RDA from publisher',
    'description': 'publisher (264>260) (preference only)',
    'function': checkPublisher,
    'validation': false,
    'preference': true,
    'preference_message_fi': 'suosi tietuetta, jossa julkaisutiedot ovat kentässä 264',
    'validation_message_fi': ''},

  // what are we checking here? could probably be a warning for human merge
  // - fail merging online and direct using electronical resources (008/23 or 008/29 form of item)
  // - fail merge if 008/06 type of date/publication status codes are a severe mismatch
  // - preference from 008/06 type of date/publication status codes
  // - gathers 008/39 cataloiguingSource, but does do anything with it?
  {'name': 'f008',
    'description': '008 test (validation and preference)',
    'function': check008,
    'validation': true,
    'preference': true,
    'manual': 'warning',
    'preference_message_fi': 'suosi tietuetta, jossa on tarkemmin ilmoitettu julkaisuajan tyyppi/julkaisun tila',
    'validation_message_fi': 'tietueita, joissa on ristiriitainen julkaisuajan tyyppi/julkaisun tila ei voi yhdistää'},

  // This test checks is just for preference despite its description!
  // Priority order: FIKKA > ANY > NONE
  {'name': 'LOW-for-preference',
    'description': 'LOW test (preference)',
    'function': checkLOW,
    'validation': false,
    'preference': true,
    'preference_message_fi': 'suosi tietuetta, jossa on Kansalliskirjaston tietokantatunnus',
    'validation_message_fi': ''},

  // database internal merge cannot merge two records with same low
  {'name': 'LOW-validation-for-internal',
    'description': 'LOW test (validation for internal)',
    'function': checkLOWinternal,
    'validation': true,
    'preference': false,
    'import': false,
    'internal': true,
    'preference_message_fi': '',
    'validation_message_fi': 'tietueita, joissa on saman paikalliskannan tietokantatunnus, ei voi yhdistää'},

  // This test check 042 to preference
  {'name': 'f042-authentication-code',
    'description': 'field 042: authentication code (preference only)',
    'function': check042,
    'validation': false,
    'preference': true,
    'preference_message_fi': 'suosi tietuetta, jossa on Kansallisbibliografian tai Kansallisdiskografian autentikaatiokoodi',
    'validation_message_fi': ''},

  {'name': 'CAT',
    'description': 'CAT test (preference only)',
    'function': checkCAT,
    'validation': false,
    'preference': true,
    'preference_message_fi': 'suosi tietuetta, jolla on paremmat kuvailuhistoriatiedot',
    'validation_message_fi': ''},

  // NB! I'd like to have a test for 008/06, but them specs for it are elusive?
  {'name': 'title',
    'description': 'field 245 (title)',
    'function': checkAllTitleFeatures,
    'validation': true,
    'preference': false,
    'manual': 'warning',
    'preference_message_fi': '',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, niiden nimeketiedot eroavat'},

  // Do not use old check f245 same time as checkAllTitleFeatures
  //{'name': 'title-old', 'description': 'field 245 (title)', 'function': check245, 'validation': true, 'preference': false, 'manual': 'warning'},

  // human merge: warning
  {'name': 'f336',
    'description': 'field 336 (content type) test (validation and preference)',
    'function': check336,
    'validation': true,
    'preference': true,
    'manual': 'warning',
    'preference_message_fi': 'suosi tietuetta, jolla on tarkemmat sisältötyyppitiedot',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, niiden sisältötyyppitiedot eroavat'},

  // human merge: warning
  {'name': 'f337',
    'description': 'field 337 (media type) test (validation and preference)',
    'function': check337,
    'validation': true,
    'preference': true,
    'manual': 'warning',
    'preference_message_fi': 'suosi tietuetta, jolla on tarkemmat mediatyyppitiedot',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, niiden mediatyyppitiedot eroavat'},

  // human merge: warning
  {'name': 'f338',
    'description': 'field 338 (carrier type) test (validation and preference)',
    'function': check338,
    'validation': true,
    'preference': true,
    'manual': 'warning',
    'preference_message_fi': 'suosi tietuetta, jolla on tarkemmat tallennetyyppitiedot',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, niiden tallennetyyppitiedot eroavat'},

  // human merge: warning for subfields q&g - $w actually should be different ...
  {'name': 'f773',
    'description': '773 $wgq test (validation only)',
    'function': check773,
    'validation': true,
    'preference': false,
    'manual': 'warning',
    'preference_message_fi': '',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, osakohteen sijaintitiedot eroavat'},

  {'name': 'f040b',
    'description': '040$b (language of cataloging) (preference only)',
    'function': check040b,
    'validation': false,
    'preference': true,
    'preference_message_fi': 'suosi tietuetta, jolla on soveltuvin kuvailukieli',
    'validation_message_fi': ''},

  {'name': 'f040e',
    'description': '040$e (description conventions) (preference only)',
    'function': check040e,
    'validation': false,
    'preference': true,
    'preference_message_fi': 'suosi tietuetta, jonka kuvailusäännöiksi on merkitty RDA',
    'validation_message_fi': ''},

  // SID for import (do not use for manual database internal merge)
  // - fail merge for different SIDs from same database
  // set preference for record that has most commons SIDs
  {'name': 'fSID-for-import',
    'description': 'SID test (validation and preference), for import only',
    'function': checkSID,
    'validation': true,
    'preference': true,
    'internal': false,
    //'manual': false,
    'preference_message_fi': 'suosi tietuetta, jolla on enemmän linkkejä vastintietueisiin paikalliskannoissa',
    'validation_message_fi': 'tietueita, joilla on samassa paikalliskannassa eri vastintietue ei voi yhdistää'},


  // preference for record that's updated more recently
  {'name': 'f005',
    'description': '005 timestamp test (preference)',
    'function': check005,
    'validation': false,
    'preference': true,
    'preference_message_fi': 'suosi tietuetta, jota on päivitetty viimeksi',
    'validation_message_fi': ''},

  // human merge: warning
  // - fail merge, for CD vs LP record
  {'name': 'audio-sanity',
    'description': 'audio sanity check (validation only)',
    'function': performAudioSanityCheck,
    'validation': true,
    'preference': false,
    'manual': 'warning',
    'preference_message_fi': '',
    'validation_message_fi': 'tietueissa on kuvailtu CD- ja LP-levy, tarkista voiko ne yhdistää'},

  // human merge: warning
  // - fail merge, for daisy-audiobook vs generic audiobook
  {'name': 'daisy-sanity',
    'description': 'Daisy sanity check (validation only)',
    'function': performDaisySanityCheck,
    'validation': true,
    'preference': false,
    'manual': 'warning',
    'preference_message_fi': '',
    'validation_message_fi': 'tietueissa on kuvailtu yleinen ja Daisy-äänikirja, tarkista voiko ne yhdistää'},

  // human merge: warning
  // - fail merge, for DVD vs Blueray video discs
  {'name': 'dvd-blueray-sanity',
    'description': 'DVD vs Blu-Ray sanity check (validation only)',
    'function': performDvdSanityCheck,
    'validation': true,
    'preference': false,
    'manual': 'warning',
    'preference_message_fi': '',
    'validation_message_fi': 'tietueissa on kuvailtu DVD- ja Bluray-levy, tarkista voiko ne yhdistää'},

  // human merge: warning
  // - fail merge, for mismatching ISBN qualifiers
  {'name': 'isbn-qualifier',
    'description': 'ISBN qualifier sanity check (validation only)',
    'function': performIsbnQualifierCheck,
    'validation': true,
    'preference': false,
    'manual': 'warning',
    'preference_message_fi': '',
    'validation_message_fi': 'tietueissa on eroava ISBN-tarkenne, tarkista voiko ne yhdistää'},

  // human merge: warning
  // - fail merge, part of a multipart monograph vs whole set of multipart monographs
  {'name': 'parts-sets',
    'description': 'Parts vs sets test (validation)',
    'function': compareRecordsPartSetFeatures,
    'validation': true,
    'preference': false,
    'manual': 'warning',
    'preference_message_fi': '',
    'validation_message_fi': 'tietueissa on kuvailtu yksittäinen moniosaisen monografian osa ja moniosainen monografia kokonaisuutena, tarkista voiko ne yhdistää'}
];

const comparisonTasksTable = {
  recordImport: [...originalComparisonTasks].filter(isUsableForImport),
  // merge two records existing in database together, checked by human user in UI
  humanMerge: [...originalComparisonTasks.filter(isUsableForInternal).filter(isUsableForManual)]
};

debugDev(`------------ RECORD IMPORT --------`);
debugDev(`comparisonTasksTable.recordImport has ${comparisonTasksTable.recordImport.length} comparison tasks:`);
debugDev(`${comparisonTasksTable.recordImport.map((task) => task.description).join('\n')}`);
debugDev(`------------ HUMAN MERGE --------`);
debugDev(`comparisonTasksTable.humanMerge has ${comparisonTasksTable.humanMerge.length} comparison tasks:`);
debugDev(`${comparisonTasksTable.humanMerge.map((task) => task.description).join('\n')}`);

// Manual merge: merge done manually in an UI
function isUsableForManual(task) {
  if (task.manual !== undefined && task.manual === false) {
    debugDev(`${task.name} has manual: ${task.manual}`);
    return false;
  }
  debugDev(`${task.name} has manual: ${task.manual}`);
  return true;
}

// Internal merge: merging two records in the database together
function isUsableForInternal(task) {
  if (task.internal !== undefined && task.internal === false) {
    debugDev(`${task.name} has internal: ${task.internal}`);
    return false;
  }
  debugDev(`${task.name} has internal: ${task.internal}`);
  return true;
}

// Import merge: merging incoming record and database record together
function isUsableForImport(task) {
  if (task.import !== undefined && task.import === false) {
    debugDev(`${task.name} has import: ${task.import}`);
    return false;
  }
  debugDev(`${task.name} has import: ${task.import}`);
  return true;
}

// Apply some recursion evilness/madness/badness to perform only the tests we really really really want.
function runComparisonTasks({nth, record1, record2, checkPreference = true, record1External = {}, record2External = {}, returnAll = false, comparisonTasks = comparisonTasksTable.recordImport}) {

  // DEVELOP: We could skip those tasks that are !validation if !checkPreference - but how?

  const currResult = comparisonTasks[nth].function({record1, record2, checkPreference, record1External, record2External});
  // NB! Aborts after the last task or after a failure (meaning currResult === false)! No further tests are performed. Recursion means optimization :D
  debugDev(`Running task ${nth} (${comparisonTasks[nth].name}) - returnAll: ${returnAll}`);
  if (nth === comparisonTasks.length - 1 || (!returnAll && currResult === false)) { // eslint-disable-line no-extra-parens
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
      type: comparisonTasks[i].manual === undefined ? 'error' : comparisonTasks[i].manual,
      // eslint-disable-next-line camelcase
      validation_message_fi: comparisonTasks[i].validation_message_fi,
      // eslint-disable-next-line camelcase
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

    // If we do not want all results, if any of tests fails, return false and desciprion for failing test
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
export function matchValidationForMergeUi({record1Object, record2Object, checkPreference = true, record1External = {'recordSource': 'databaseRecord'}, record2External = {'recordSource': 'databaseRecord'}, manual = true, comparisonTasks = comparisonTasksTable.humanMerge}) {
  debugDev(`Manual ${manual} (for Merge UI) - we have ${comparisonTasks.length} comparison tasks`);

  // Create MarcRecords here to avoid problems with differing MarcRecord versions etc.
  const record1 = new MarcRecord(record1Object, {subfieldValues: false});
  const record2 = new MarcRecord(record2Object, {subfieldValues: false});

  const result = makeComparisons({record1, record2, checkPreference, record1External, record2External, returnAll: true, comparisonTasks});
  debugDev(JSON.stringify(result));
  // return result-array of all results
  return result;
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
