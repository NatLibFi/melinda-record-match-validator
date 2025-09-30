/* eslint-disable max-lines */
import createDebugLogger from 'debug';
import {isDeletedRecord, isTestRecord, isComponentRecord} from '@natlibfi/melinda-commons';

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
import {check773, check773Internal} from './field773';
//import {check984} from './field984';
import {checkLeader, checkTypeOfRecord, checkRecordLevel} from './leader';
import {check005, check008} from './controlFields';
import {compareRecordsPartSetFeatures} from './partsAndSets';
import {performAudioSanityCheck} from './sanityCheckAudio';
import {performDaisySanityCheck} from './sanityCheckDaisy';
import {performDvdSanityCheck} from './sanityCheckDvd';
import {performIsbnQualifierCheck} from './sanityCheckIsbnQualifer';

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

// DEVELOP: move comparisonTask metadata mainly to the function files
// DEVELOP: add tag information for highlighting problematic fields / positions / subfields for human user
// DEVELOP: multilingual human readable messages

/*
name: short name for comparison task
description: longer, original description for comparison task

validation: comparison task is used for validation
preference: comparison task is used for choosing preferred record

manual: is comparison check usable in manual (internal) merge, type of fail if used [true/error/warning/false], defaults to: true/error if undefined
internal: is comparison check usable in internal merge (ie. merging two database records) [true/false], defaults to true if undefined
import: is comparison check usable in import merge (ie. merging an incoming record and a database record) [true/false], defaults to true if undefined

preference_message_fi: human readable message in Finnish for comparing record preference for merging
validation_message_fi: human readable message in Finnish for validating records for merging

DEVELOP: tags: tags to highlight fields/subfields/positions of fields and field parts that caused the matchValidation error/warning
*/


const comparisonTasks = [ // NB! These are/should be in priority order for recordImport, which checks only until first failure!
  // undefined or deleted records cannot be merged (both automatic and human merge)
  {'name': 'existence',
    'description': 'existence (validation only)',
    'function': checkExistence,
    'validation': true,
    'preference': false,
    'preference_message_fi': '',
    'validation_message_fi': 'poistettuja tietueita ei voi yhdistää',
    'tags': [{'tag': 'STA'}, {'tag': 'DEL'}, {'tag': 'LDR', 'chars': ['5']}]},

  // test records and non test records should not be merged
  {'name': 'test record',
    'description': 'test record',
    'function': checkTestRecord,
    'validation': true,
    'preference': false,
    'import': true,
    'internal': true,
    'manual': 'error',
    'preference_message_fi': '',
    'validation_message_fi': 'testitietuetta ja normaalia tietuetta ei voi yhdistää',
    'tags': [{'tag': 'STA'}]},

  // host and component records should not be merged
  {'name': 'host/component',
    'description': 'host/component record',
    'function': checkHostComponent,
    'validation': true,
    'preference': false,
    'import': true,
    'internal': true,
    'manual': 'error',
    'preference_message_fi': '',
    'validation_message_fi': 'osakohdetta ja ei-osakohdetta ei voi yhdistää',
    'tags': [{'tag': '773'}, {'tag': '973'}, {'tag': 'LDR', 'chars': ['7']}]},

  // checks record type LDR/06 && bibliographic level LDR/07 (validation) and LDR/17 for encoding level (preference)s
  // - fail merge if LDR/006-7 are mismatch
  // - preference based on encoding level and more nuanced prepublication level for prepub records
  // Prioritize LDR/17 (encoding level)
  {'name': 'leader',
    'description': 'leader (validation and preference)',
    'function': checkLeader,
    'validation': true,
    'preference': true,
    'manual': false,
    'import': true,
    'internal': true,
    'validation_message_fi': 'ainestotyypiltään tai bibliografiselta tasoltaan eroavia tietueita ei voi yhdistää',
    'preference_message_fi': 'suosi koodaus- ja ennakkotietotasoltaan parempaa tietuetta'},

  // Singular leader comparisons for Human/internal merge

  // leader typeOfRecord LDR/006
  // do not use same time as checkLeader that checks all three leader values
  {'name': 'typeOfRecord',
    'description': 'leader: typeOfRecord (validation)',
    'function': checkTypeOfRecord,
    'validation': true,
    'preference': false,
    'manual': 'warning',
    'import': false,
    'internal': true,
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
    'internal': true,
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
    'internal': true,
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
    'internal': true,
    'import': true,
    'manual': false, // let's not give too many preference warnings for a human user
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
    'internal': true,
    'import': true,
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
    'internal': true,
    'import': true,
    'manual': true,
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
    'manual': 'error',
    'preference_message_fi': '',
    'validation_message_fi': 'tietueita, joissa on saman paikalliskannan tietokantatunnus, ei voi yhdistää'},

  // This test check 042 to preference
  {'name': 'f042-authentication-code',
    'description': 'field 042: authentication code (preference only)',
    'function': check042,
    'validation': false,
    'preference': true,
    'internal': true,
    'import': true,
    'manual': true,
    'preference_message_fi': 'suosi tietuetta, jossa on Kansallisbibliografian tai Kansallisdiskografian autentikaatiokoodi',
    'validation_message_fi': ''},

  {'name': 'CAT',
    'description': 'CAT test (preference only)',
    'function': checkCAT,
    'validation': false,
    'preference': true,
    'internal': true,
    'import': true,
    'manual': false, // let's not give too many preference warnings for a human cataloger
    'preference_message_fi': 'suosi tietuetta, jolla on paremmat kuvailuhistoriatiedot',
    'validation_message_fi': ''},

  // NB! I'd like to have a test for 008/06, but them specs for it are elusive?
  {'name': 'title',
    'description': 'field 245 (title)',
    'function': checkAllTitleFeatures,
    'validation': true,
    'preference': false,
    'internal': true,
    'import': true,
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
    'internal': true,
    'import': true,
    'manual': 'warning',
    'preference_message_fi': 'suosi tietuetta, jolla on tarkemmat sisältötyyppitiedot',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, niiden sisältötyyppitiedot eroavat'},

  // human merge: warning
  {'name': 'f337',
    'description': 'field 337 (media type) test (validation and preference)',
    'function': check337,
    'validation': true,
    'preference': true,
    'internal': true,
    'import': true,
    'manual': 'warning',
    'preference_message_fi': 'suosi tietuetta, jolla on tarkemmat mediatyyppitiedot',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, niiden mediatyyppitiedot eroavat'},

  // human merge: warning
  {'name': 'f338',
    'description': 'field 338 (carrier type) test (validation and preference)',
    'function': check338,
    'validation': true,
    'preference': true,
    'internal': true,
    'import': true,
    'manual': 'warning',
    'preference_message_fi': 'suosi tietuetta, jolla on tarkemmat tallennetyyppitiedot',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, niiden tallennetyyppitiedot eroavat'},

  // human merge: warning for subfields q&g - $w actually should be different ...
  {'name': 'f773-for-internal',
    'description': '773 $wgq test (validation only)',
    'function': check773Internal,
    'validation': true,
    'preference': false,
    'internal': true,
    'import': false,
    'manual': 'warning',
    'preference_message_fi': '',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, osakohteen sijaintitiedot eroavat'},

  {'name': 'f773-for-import',
    'description': '773 $wgq test (validation only)',
    'function': check773,
    'validation': true,
    'preference': false,
    'internal': false,
    'import': true,
    'manual': false,
    'preference_message_fi': '',
    'validation_message_fi': 'tarkista voiko tietueet yhdistää, osakohteen sijaintitiedot eroavat'},

  {'name': 'f040b',
    'description': '040$b (language of cataloging) (preference only)',
    'function': check040b,
    'validation': false,
    'preference': true,
    'internal': true,
    'import': true,
    'manual': true,
    'preference_message_fi': 'suosi tietuetta, jolla on soveltuvin kuvailukieli',
    'validation_message_fi': ''},

  {'name': 'f040e',
    'description': '040$e (description conventions) (preference only)',
    'function': check040e,
    'validation': false,
    'preference': true,
    'internal': true,
    'import': true,
    'manual': true,
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
    'import': true,
    'manual': false,
    'preference_message_fi': 'suosi tietuetta, jolla on enemmän linkkejä vastintietueisiin paikalliskannoissa',
    'validation_message_fi': 'tietueita, joilla on samassa paikalliskannassa eri vastintietue ei voi yhdistää'},


  // preference for record that's updated more recently
  {'name': 'f005',
    'description': '005 timestamp test (preference)',
    'function': check005,
    'validation': false,
    'preference': true,
    'internal': true,
    'import': true,
    'manual': false, // let's not give too many preference warnings for a human cataloger
    'preference_message_fi': 'suosi tietuetta, jota on päivitetty viimeksi',
    'validation_message_fi': ''},

  // human merge: warning
  // - fail merge, for CD vs LP record
  {'name': 'audio-sanity',
    'description': 'audio sanity check (validation only)',
    'function': performAudioSanityCheck,
    'validation': true,
    'preference': false,
    'internal': true,
    'import': true,
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
    'internal': true,
    'import': true,
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
    'internal': true,
    'import': true,
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
    'internal': true,
    'import': true,
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
    'internal': true,
    'import': true,
    'manual': 'warning',
    'preference_message_fi': '',
    'validation_message_fi': 'tietueissa on kuvailtu yksittäinen moniosaisen monografian osa ja moniosainen monografia kokonaisuutena, tarkista voiko ne yhdistää'}
];

export const comparisonTasksTable = {
  recordImport: [...comparisonTasks].filter(isUsableForImport),
  // merge two records existing in database together, checked by human user in UI
  humanMerge: [...comparisonTasks.filter(isUsableForInternal).filter(isUsableForManual)]
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
