import createDebugLogger from 'debug';

import {getBibliographicLevel, getEncodingLevel, getRecordInfo, getTypeOfRecord, EI_ENNAKKOTIETO, KONEELLISESTI_TUOTETTU_TIETUE, TARKISTETTU_ENNAKKOTIETO, ENNAKKOTIETO} from '../collectFunctions/collectLeader.js';
import {nvdebug} from '../utils.js';


const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareFunctions/compareLeader');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');


function rateValues(valueA, valueB, rateArray) {
  // NB! Assumes { code: ... } which is bad!
  debugDev('%o vs %o', valueA, valueB);
  if (valueA.code === valueB.code) {
    debugDev('Both same: returning true');
    return true;
  }

  if (rateArray) { // Preference array, [0] is the best (=1).
    const ratingOfA = rateArray.indexOf(valueA.code) + 1;
    const ratingOfB = rateArray.indexOf(valueB.code) + 1;

    if (ratingOfA === 0) {
      if (ratingOfB !== 0) {
        debugDev('A\'s value not found in array. Return B');
        return 'B';
      }
      //debugDev('Value not found from array');
      return false;
    }
    if (ratingOfB === 0) {
      debugDev('B\'s value not found in array. Return A');
      return 'A';
    }


    if (ratingOfA < ratingOfB) {
      debugDev('A better: returning A');
      return 'A';
    }

    debugDev('B better: returning B');
    return 'B';
  }

  debugDev('Both different: returning false');
  return false;
}

function compareTypeOfRecord(a, b) {
  debugDev('Record A type: %o', a);
  debugDev('Record B type: %o', b);
  //nvdebug(`type of record: '${a}' vs '${b}', debugDev`);
  // rateValues, no rateArray: no preference, just validation false - true
  return rateValues(a, b);
}

function compareBibliographicLevel(a, b) {
  debugDev('Record A bib level: %o', a);
  debugDev('Record B bib level: %o', b);
  // rateValues, no rateArray: no preference, jsut validation false - true
  return rateValues(a, b);
}

function compareEncodingLevel(a, b, prePubA, prePubB, recordSourceA, recordSourceB) {
  debugDev('Record A completion level: %o', a);
  debugDev('Record B completion level: %o', b);
  nvdebug(prePubA ? `Record A prepub level: ${JSON.stringify(prePubA)}` : 'N/A', debugDev);
  nvdebug(prePubB ? `Record B prepub level: ${JSON.stringify(prePubB)}` : 'N/A', debugDev);
  nvdebug(recordSourceA ? `Record A external type: ${JSON.stringify(recordSourceA)}` : 'N/A', debugDev);
  nvdebug(recordSourceB ? `Record B external type: ${JSON.stringify(recordSourceB)}` : 'N/A', debugDev);

  if (prePubA && prePubB && a.code === b.code && ['2', '8'].includes(a.code)) { // Handle exception first: all prepublications are not equal!

    const prePubValue = rateValues(prePubA, prePubB, [EI_ENNAKKOTIETO, KONEELLISESTI_TUOTETTU_TIETUE, TARKISTETTU_ENNAKKOTIETO, ENNAKKOTIETO]);

    // we'll check recordSource only if we have '8' or '2' records which have same prePubValue
    // and prepubLevel is something else than '0' (not a prepublication)
    if (prePubValue === true && prePubA.code !== '0' && prePubB.code !== '0') {
      const valueA = {code: recordSourceA};
      const valueB = {code: recordSourceB};
      const rateArray = ['incomingRecord', 'databaseRecord', undefined];
      return rateValues(valueA, valueB, rateArray);
    }

    return prePubValue;
  }
  // Note: For record import stuff we'll propably have 'Koneellisesti tuotettu tietue' encoding level as '2' - this needs to be reorganized!
  // Best first, see encodingLevelHash above.
  // const rateArray = [' ', '1', '2', '3', '4', '5', '7', 'u', 'z', '8'];
  const rateArray = [' ', '1', '4', '5', '2', '7', '3', 'u', 'z', '8']; // MET-145

  return rateValues(a, b, rateArray);
}

export function compareLeader(recordValuesA, recordValuesB) {
  const f000A = recordValuesA['000'];
  const f000B = recordValuesB['000'];

  const result = {
    typeOfRecord: compareTypeOfRecord(f000A.typeOfRecord, f000B.typeOfRecord),
    bibliographicLevel: compareBibliographicLevel(f000A.bibliographicLevel, f000B.bibliographicLevel),
    encodingLevel: compareEncodingLevel(f000A.encodingLevel, f000B.encodingLevel, f000A.prepublicationLevel, f000B.prepublicationLevel)
  };
  //nvdebug('NV WP9', debugDev);
  //nvdebug(JSON.stringify(result), debugDev);
  return result;
}

// check typeOfRecord (LDR/06)
export function checkTypeOfRecord({record1, record2}) {
  const recordInfo1 = getTypeOfRecord(record1);
  const recordInfo2 = getTypeOfRecord(record2);

  return compareTypeOfRecord(recordInfo1.typeOfRecord, recordInfo2.typeOfRecord);
}

// check bibliographicLevel (LDR/07)
export function checkBibliographicLevel({record1, record2}) {
  const recordInfo1 = getBibliographicLevel(record1);
  const recordInfo2 = getBibliographicLevel(record2);

  return compareBibliographicLevel(recordInfo1.bibliographicLevel, recordInfo2.bibliographicLevel);
}

// Check record encoding level + prepublication level, mostly for preference
export function checkRecordLevel({record1, record2, record1External = {}, record2External = {}}) {
  const recordInfo1 = getEncodingLevel(record1);
  const recordInfo2 = getEncodingLevel(record2);
  const recordSource1 = record1External.recordSource || undefined;
  const recordSource2 = record2External.recordSource || undefined;

  return compareEncodingLevel(recordInfo1.encodingLevel, recordInfo2.encodingLevel, recordInfo1.prepublicationLevel, recordInfo2.prepublicationLevel, recordSource1, recordSource2);
}


// Check all values from leader
export function checkLeader({record1, record2, checkPreference = true, record1External = {}, record2External = {}}) {
  const recordInfo1 = getRecordInfo(record1);
  const recordInfo2 = getRecordInfo(record2);
  const recordSource1 = record1External.recordSource || undefined;
  const recordSource2 = record2External.recordSource || undefined;

  debugDev(`checkLeader()`);

  debugDev(`checkLeader()`);

  if (recordInfo1.typeOfRecord.code !== recordInfo2.typeOfRecord.code) {
    debugDev(`LDR: type of record failed!`);
    return false;
  }

  // DEVELOP: this could use checkBibliographicLevel?
  if (recordInfo1.bibliographicLevel.code !== recordInfo2.bibliographicLevel.code) {
    debugDev(`LDR: bibliographical level failed!`);
    return false;
  }

  const encodingLevelPreference = compareEncodingLevel(recordInfo1.encodingLevel, recordInfo2.encodingLevel, recordInfo1.prepublicationLevel, recordInfo2.prepublicationLevel, recordSource1, recordSource2);
  if (encodingLevelPreference === false) {
    debugDev(`LDR: encoding level failed!`);
    return false;
  }


  return checkPreference ? encodingLevelPreference : true;

  /*
  if (checkPreference) {
    return encodingLevelPreference;
  }
  return true;
  */
  // NB! Should we handle LDR/05 (record status) value p - Increase in encoding level from prepublication?
}

/* // An old comment with updates keys:
'000': {
    'bibliographicLevel': true,
    'encodingLevel': 'A', // A has better value
    'recordState': true, // What is this? Probably something that got dropped later on...
    'typeOfRecord': true
}
*/
