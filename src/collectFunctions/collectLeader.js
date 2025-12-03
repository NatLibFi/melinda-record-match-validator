export const EI_ENNAKKOTIETO = '0';
export const KONEELLISESTI_TUOTETTU_TIETUE = '1';
export const TARKISTETTU_ENNAKKOTIETO = '2';
export const ENNAKKOTIETO = '3';

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

function mapBibliographicLevel(bibliographicLevel) {
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

export function getTypeOfRecord(record) {

  const recordTypeRaw = record.leader[6];

  //console.log(`LDR/07 ${recordBibLevelRaw}`); // eslint-disable-line no-console
  //debug('Record type raw: %o', recordTypeRaw);

  const result = {
    typeOfRecord: mapTypeOfRecord(recordTypeRaw)
  };
  return result;
}

export function getBibliographicLevel(record) {
  const recordBibLevelRaw = record.leader[7];
  const result = {
    bibliographicLevel: mapBibliographicLevel(recordBibLevelRaw)
  };
  return result;
}

export function getEncodingLevel(record) {
  const encodingLevel = record.leader[17];
  const result = {
    encodingLevel: mapEncodingLevel(encodingLevel),
    prepublicationLevel: getPrepublicationLevel(record, encodingLevel)
  };
  return result;
}

export function getRecordInfo(record) {

  const result = {
    ...getTypeOfRecord(record),
    ...getBibliographicLevel(record),
    ...getEncodingLevel(record)
  };

  return result;
}

// PrepublicationLevel should probably be renamed secondaryEncodingLevel or something like that, because
// "Koneellisesti tuotettu tietue" records with encodingLevel "2" are not prepublication records as such

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
