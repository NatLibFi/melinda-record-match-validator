// NB! Type of record currently supports only bibs. Should we support auths (LDR/06='z') or even holdings?
import createDebugLogger from 'debug';

const EI_ENNAKKOTIETO = '0';
const KONEELLISESTI_TUOTETTU_TIETUE = '1';
const TARKISTETTU_ENNAKKOTIETO = '2';
const ENNAKKOTIETO = '3';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareFunctions/compareLeader');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

function getPrepublicationLevel(record, encodingLevel = '8') {
  const fields = record.get(/^(?:500|594)$/u);
  if (fields) {
    if (fields.some(f => f.subfields.some(sf => sf.value.includes('Koneellisesti tuotettu tietue')))) {
      return {code: KONEELLISESTI_TUOTETTU_TIETUE, level: 'Koneellisesti tuotettu tietue'};
    }

    if (fields.some(f => f.subfields.some(sf => sf.value.includes('TARKISTETTU ENNAKKOTIETO') || sf.value.includes('Tarkistettu ennakkotieto')))) {
      return {code: TARKISTETTU_ENNAKKOTIETO, level: 'TARKISTETTU ENNAKKOTIETO'};
    }

    if (fields.some(f => f.subfields.some(sf => sf.value.includes('ENNAKKOTIETO') || sf.value.includes('Ennakkotieto')))) {
      return {code: ENNAKKOTIETO, level: 'ENNAKKOTIETO'};
    }
    // If our encLevel is '8' (for actual prepublication records), let's give a lower prepubLevel if information is not found
    if (encodingLevel === '8') {
      return {code: ENNAKKOTIETO, level: 'No prepublication type found'};
    }
    return {code: EI_ENNAKKOTIETO, level: 'Not a prepublication'};
  }
  // If our encLevel is '8' (for actual prepublication records), let's give a lower prepubLevel if information is not found
  if (encodingLevel === '8') {
    return {code: ENNAKKOTIETO, level: 'No 500 or 594 fields found, cannot determine prepublication type'};
  }
  return {code: EI_ENNAKKOTIETO, level: 'Not a prepublication'};
}


function rateValues(valueA, valueB, rateArray) {
  // NB! Assumes { code: ... } which is bad!
  debugDev('%o vs %o', valueA, valueB);
  if (valueA === valueB) {
    debugDev('Both same: returning true');
    return true;
  }

  if (rateArray) { // Preference array, [0] is the best (=1).
    const ratingOfA = rateArray.indexOf(valueA) + 1;
    const ratingOfB = rateArray.indexOf(valueB) + 1;

    if (ratingOfA === 0) {
      if (ratingOfB !== 0) {
        debugDev('A value not found in array. Return B');
        return 'B';
      }
      //debugDev('Value not found from array');
      return false;
    }
    if (ratingOfB === 0) {
      debugDev('B not found in array. Return A');
      return 'A';
    }


    if (ratingOfA < ratingOfB) {
      debugDev('A is better: returning A');
      return 'A';
    }

    debugDev('B is better: returning B');
    return 'B';
  }

  debugDev('Both different: returning false');
  return false;
}

export function checkTypeOfRecord({record1, record2, checkPreference = true}) { //  ?.recordSource);
  const typeA = record1.leader[6];
  const typeB = record2.leader[6];
  debug("CTOR...");

  // Default case: same type
  if (typeA === typeB) {
    if (!isValidTypeOfRecord(typeA)) {
      // Should we crash or just fail? I prefer fail...
      debug(`ERROR: unsupported type of record '${typeA}'`);
      return false;
    }
    return true;
  }
  debug(`CTOR exception ${typeA} vs ${typeB}`);
  // Expections: soitionopas (MELKEHITYS-3499)
  if (typeA === 'a' && isSoitonopas(record2)) {
    return checkPreference ? 'B' : true;
  }
  if (typeB === 'a' && isSoitonopas(record1)) {
    return checkPreference ? 'A' : true;
  }

  return false;

  function isValidTypeOfRecord(typeOfRecord) {
    return ['a', 'c', 'd', 'e', 'f', 'g', 'i', 'j', 'k', 'm', 'o', 'p', 'r', 't'].includes(typeOfRecord);
  }

  function isSoitonopas(record) {
    if (record.leader[6] !== 'c') {
      return false;
    }
    const f300 = record.get('300');
    return f300.some(f => f.subfields.some(sf => sf.code === 'a' && sf.value.match(/(?:instumentskola|soitonopas)/ui)));
  }
}


export function checkEncodingLevel({record1, record2, checkPreference = true, record1External = {}, record2External = {}}) { //  ?.recordSource);
  const encodingLevelA = record1.leader[17];
  const encodingLevelB = record2.leader[17];

  if (encodingLevelA === encodingLevelB && ['2', '8'].includes(encodingLevelA)) { // Handle exception first: all prepublications are not equal!
    const prepublicationLevelA = getPrepublicationLevel(record1, encodingLevelA);
    const prepublicationLevelB = getPrepublicationLevel(record2, encodingLevelB);

    const prePubValue = rateValues(prepublicationLevelA.code, prepublicationLevelB.code, [EI_ENNAKKOTIETO, KONEELLISESTI_TUOTETTU_TIETUE, TARKISTETTU_ENNAKKOTIETO, ENNAKKOTIETO]);

    // We'll check recordSource only if we have '8' or '2' records which have same prePubValue and prepubLevel is not a prepublication:
    if (prePubValue === true && prepublicationLevelA.code !== EI_ENNAKKOTIETO && prepublicationLevelB.code !== EI_ENNAKKOTIETO) {
      const recordSourceA = record1External?.recordSource;
      const recordSourceB = record2External?.recordSource;
      return rateValues(recordSourceA, recordSourceB,  ['incomingRecord', 'databaseRecord', undefined]);
    }

    return prePubValue;
  }
  // Note: For record import stuff we'll propably have 'Koneellisesti tuotettu tietue' encoding level as '2' - this needs to be reorganized!
  // Best first, see encodingLevelHash above.
  // const rateArray = [' ', '1', '2', '3', '4', '5', '7', 'u', 'z', '8'];
  const rateArray = [' ', '1', '4', '5', '2', '7', '3', 'u', 'z', '8']; // MET-145
  return rateValues(encodingLevelA, encodingLevelB, rateArray);
}



// check bibliographicLevel (LDR/07)
export function checkBibliographicLevel({record1, record2}) {
  const levelA = record1.leader[7];
  const levelB = record2.leader[7];
  if (levelA !== levelB) {
    return false;
  }
  return(['a', 'b', 'c', 'd', 'i', 'm', 's'].includes(levelA));
}




// record1External.recordSource

// Check all values from leader
export function checkLeader({record1, record2, checkPreference = true, record1External = {}, record2External = {}}) {
  // Check leades lengths:
  if (record1.leader.length !== 24 || record2.leader.length !== 24) {
    debugDev(`LDR: wrong leader length!`);
    return false;
  }

  const typeOfRecordResult = checkTypeOfRecord({record1, record2, checkPreference});
  if (!typeOfRecordResult) {
    debugDev(`LDR: type of record (LDR/06) mismatch`);
    return false;
  }

  const bibliographicLevelResult = checkBibliographicLevel({record1, record2});
  if (!bibliographicLevelResult) {
    debugDev(`LDR: bibliographic level (LDR/07) mismatch`);
    return false;
  }

  const encodingLevelResult = checkEncodingLevel({record1, record2, checkPreference, record1External, record2External});
  if (!encodingLevelResult) {
    debugDev(`LDR: encoding level (LDR/17) error`);
    return false;
  }

  if (!checkPreference) {
    return true;
  }

  if (typeOfRecordResult !== true) { // soitonopas > book
    return typeOfRecordResult;
  }
  // Bibliographic level is always a Boolean value, so no need to check it
  if (encodingLevelResult !== true) {
    return encodingLevelResult;
  }
  return true;
}
