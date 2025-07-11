
import createDebugLogger from 'debug';
import {nvdebug} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:leader');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

// Descriptions of type of record, bibliographical level and encoding level are taken from official specs:
// https://www.loc.gov/marc/bibliographic/bdleader.html

const typeOfRecordHash = {
  'a': 'Language material',
  'c': 'Notated music',
  'd': 'Manuscript notated music',
  'e': 'Cartographic material',
  'f': 'Manuscript cartographic material',
  'g': 'Projected medium',
  'i': 'Nonmusical sound recording',
  'j': 'Musical sound recording',
  'k': 'Two-dimensional nonprojectable graphic',
  'm': 'Computer file',
  'o': 'Kit',
  'p': 'Mixed materials',
  'r': 'Three-dimensional artifact or naturally occurring object',
  't': 'Manuscript language material'
};

const bibliographicLevelHash = { // LDR/07
  'a': 'Monographic component part',
  'b': 'Serial component part',
  'c': 'Collection',
  'd': 'Subunit',
  'i': 'Integrating resource',
  'm': 'Monograph/Item',
  's': 'Serial'
};

// Note: if we have '2' for 'Koneellisesti tuotettu tietue' it should have lower prefence than here
const encodingLevelHash = {
  ' ': 'Full level',
  '1': 'Full level, material not examined',
  '2': 'Less-than-full level, material not examined',
  '3': 'Abbreviated level',
  '4': 'Core level',
  '5': 'Partial (preliminary) level',
  '7': 'Minimal level',
  '8': 'Prepublication level',
  'u': 'Unknown',
  'z': 'Not applicable'
};

function mapTypeOfRecord(typeOfRecord) {
  if (typeOfRecord in typeOfRecordHash) {
    return {level: typeOfRecordHash[typeOfRecord], code: typeOfRecord};
  }
  throw new Error(`Invalid record type ${typeOfRecord}`);
}

function mapBibliographicalLevel(bibliographicLevel) {
  if (bibliographicLevel in bibliographicLevelHash) {
    return {level: bibliographicLevelHash[bibliographicLevel], code: bibliographicLevel};
  }

  throw new Error('Invalid record bib level');
}

function mapEncodingLevel(encodingLevel) {
  if (encodingLevel in encodingLevelHash) {
    return {level: encodingLevelHash[encodingLevel], code: encodingLevel};
  }
  throw new Error('Invalid record completion level');
}

export function getRecordInfo(record) {

  const recordTypeRaw = record.leader[6]; // eslint-disable-line prefer-destructuring
  const recordBibLevelRaw = record.leader[7]; // eslint-disable-line prefer-destructuring
  const recordCompletionLevel = record.leader[17]; // eslint-disable-line prefer-destructuring

  //console.log(`LDR/07 ${recordBibLevelRaw}`); // eslint-disable-line no-console
  //debug('Record type raw: %o', recordTypeRaw);
  //debug('Record bib level raw: %o', recordBibLevelRaw);
  //debug('Record completion level raw: %o', recordCompletionLevel);

  const result = {
    typeOfRecord: mapTypeOfRecord(recordTypeRaw),
    bibliographicLevel: mapBibliographicalLevel(recordBibLevelRaw),
    encodingLevel: mapEncodingLevel(recordCompletionLevel),
    prepublicationLevel: getPrepublicationLevel(record, recordCompletionLevel)
  };

  /*
  if (recordCompletionLevel === '8') {
    return addPrepublicationLevel(result, record);
  }
  */


  return result;

  /*
  function addPrepublicationLevel(result, record) {
    const level = getPrepublicationLevel(record);
    result.prepublicationLevel = level; // eslint-disable-line functional/immutable-data
    return result;
  }
  */

  // DEVELOP:
  // encoding level '2' && 'Koneellisesti tuotettu tietue'
  function getPrepublicationLevel(record, encodingLevel = '8') {
    if (encodingLevel !== '8') {
      return {code: '0', level: 'Not a prepublication'};
    }

    const fields = record.get(/^(?:500|594)$/u);
    if (fields) {
      if (fields.some(f => f.subfields.some(sf => sf.value.includes('Koneellisesti tuotettu tietue')))) {
        return {code: '1', level: 'Koneellisesti tuotettu tietue'};
      }

      if (fields.some(f => f.subfields.some(sf => sf.value.includes('TARKISTETTU ENNAKKOTIETO') || sf.value.includes('Tarkistettu ennakkotieto')))) {
        return {code: '2', level: 'TARKISTETTU ENNAKKOTIETO'};
      }

      if (fields.some(f => f.subfields.some(sf => sf.value.includes('ENNAKKOTIETO') || sf.value.includes('Ennakkotieto')))) {
        return {code: '3', level: 'ENNAKKOTIETO'};
      }

      return {code: '3', level: 'No prepublication type found'};
    }

    return {code: '3', level: 'No 500 or 594 fields found, cant determine prepublication type'};
  }
}

// eslint-disable-next-line max-statements
function rateValues(valueA, valueB, rateArray) {
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
  return rateValues(a, b);
}

function compareBibliographicalLevel(a, b) {
  debugDev('Record A bib level: %o', a);
  debugDev('Record B bib level: %o', b);

  return rateValues(a, b);
}

// eslint-disable-next-line max-params
function compareEncodingLevel(a, b, prePubA, prePubB, recordSourceA, recordSourceB) {
  debugDev('Record A completion level: %o', a);
  debugDev('Record B completion level: %o', b);
  nvdebug(prePubA ? `Record A prepub level: ${JSON.stringify(prePubA)}` : 'N/A', debugDev);
  nvdebug(prePubB ? `Record B prepub level: ${JSON.stringify(prePubB)}` : 'N/A', debugDev);
  nvdebug(recordSourceA ? `Record A external type: ${JSON.stringify(recordSourceA)}` : 'N/A', debugDev);
  nvdebug(recordSourceB ? `Record B external type: ${JSON.stringify(recordSourceB)}` : 'N/A', debugDev);

  if (prePubA && prePubB && a.code === '8' && b.code === '8') { // Handle exception first: all prepublications are not equal!

    const prePubValue = rateValues(prePubA, prePubB, ['0', '1', '2', '3']);

    if (prePubValue === true) {
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
    bibliographicLevel: compareBibliographicalLevel(f000A.bibliographicLevel, f000B.bibliographicLevel),
    encodingLevel: compareEncodingLevel(f000A.encodingLevel, f000B.encodingLevel, f000A.prepublicationLevel, f000B.prepublicationLevel)
  };
  //nvdebug('NV WP9', debugDev);// eslint-disable-line no-console
  //nvdebug(JSON.stringify(result), debugDev); // eslint-disable-line no-console
  return result;
}

export function checkLeader({record1, record2, checkPreference = true, record1External = {}, record2External = {}}) {
  const recordInfo1 = getRecordInfo(record1);
  const recordInfo2 = getRecordInfo(record2);
  const recordSource1 = record1External.recordSource || undefined;
  const recordSource2 = record2External.recordSource || undefined;


  debugDev(`checkLeader()`); // eslint-disable-line no-console

  if (recordInfo1.typeOfRecord.code !== recordInfo2.typeOfRecord.code) {
    debugDev(`LDR: type of record failed!`); // eslint-disable-line no-console
    return false;
  }

  if (recordInfo1.bibliographicLevel.code !== recordInfo2.bibliographicLevel.code) {
    debugDev(`LDR: bibliographical level failed!`); // eslint-disable-line no-console
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
