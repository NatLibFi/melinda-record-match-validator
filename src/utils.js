import {getSubfieldValue, getSubfieldValues} from './collectFunctions/collectUtils';

const validValuesForSubfield = {
  '336‡b': ['prm', 'tdi', 'tdm', 'ntm', 'spw', 'sti', 'txt', 'snd'],
  '336‡2': ['rdacontent'],
  '337‡b': ['c', 'e', 'g', 'h', 'n', 'p', 's', 'v', 'x', 'z'],
  '337‡2': ['rdamedia'],
  '338‡b': ['ca', 'cb', 'cd', 'ce', 'cf', 'ch', 'ck', 'cr', 'cz', 'eh', 'es', 'ez', 'gc', 'gd', 'gf', 'gs', 'gt', 'ha', 'hb', 'hc', 'hd', 'he', 'hf', 'hg', 'hh', 'hj', 'hz', 'mc', 'mf', 'mo', 'mr', 'mz', 'na', 'nb', 'nc', 'nn', 'no', 'nr', 'nz', 'pp', 'pz', 'sd', 'ss', 'st', 'sz', 'vc', 'vd', 'vf', 'vr', 'vz', 'zu'],
  '338‡2': ['rdacarrier']
};

function stripControlNumberPart(id) {
  // return "(FOO)" from "(FOO)BAR"
  if ((/^\([^)]+\)[0-9]+$/u).test(id)) {
    return id.substr(0, id.indexOf(')') + 1);
  }
  return null; // Not exactly sure what failure should return... empty string or null I guess...
}

function nvdebug(message) {
  //  debug(message);
  console.info(message); // eslint-disable-line no-console
}

export function sameControlNumberIdentifier(id1, id2) { // Same parenthesis part
  if (id1 === id2) {
    return true;
  } // eg. "(FOO)BAR" === "(FOO)BAR"
  if (stripControlNumberPart(id1) === stripControlNumberPart(id2)) {
    return true;
  } // "(FOO)LORUM" vs "(FOO)IPSUM"
  return false; // IDs come from different databases
}


export function fieldToString(f) {
  if ('subfields' in f) {
    return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;
  }
  return `${f.tag}    ${f.value}`;
  function formatSubfields(field) {
    return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
  }
}

export function isControlSubfieldCode(subfieldCode) {
  if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'w'].includes(subfieldCode)) {
    return true;
  }
  return false;
}

export function fieldHasSubfield(field, subfieldCode, subfieldValue = null) {
  if (subfieldValue === null) {
    return field.subfields.some(sf => sf.code === subfieldCode);
  }
  return field.subfields.some(sf => sf.code === subfieldCode && subfieldValue === sf.value);
}

export function getPublisherFields(record) {
  return record.fields.filter(field => isPublisherField(field));

  function isPublisherField(field) {
    if (field.tag === '260') {
      return true;
    }
    return field.tag === '264' && field.ind2 === '1';
  }
}

export function fieldHasValidNonRepeatableSubfield(field, subfieldCode) {
  const uniqueValue = fieldGetNonRepeatableValue(field, subfieldCode);
  if (uniqueValue === null) {
    nvdebug(`fieldHasValidNonRepeatableSubfield() returns false`);
    return false;
  }
  //nvdebug(`fieldHasValidNonRepeatableSubfield() returns true`);
  return true;
}

export function fieldGetNonRepeatableValue(field, subfieldCode) {
  //nvdebug(` fieldGetNonRepeatableValue('${fieldToString(field)}', '${subfieldCode}') in...`);
  const subfieldValues = getSubfieldValues(field, subfieldCode);
  if (subfieldValues.length !== 1) { // require exactly one instance exists
    nvdebug(`  ${field.tag}‡${subfieldCode}: ${subfieldValues.length} subfields found`);
    return null;
  }
  //nvdebug(JSON.stringify(subfields[0]));
  const key = `${field.tag}‡${subfieldCode}`;
  if (key in validValuesForSubfield) {
    if (!validValuesForSubfield[key].includes(subfieldValues[0])) {
      nvdebug(`  fieldGetNonRepeatableValue() return null ('${subfieldValues[0]}' not found in '${validValuesForSubfield[key].join('/')}')`);
      return null;
    }
  }
  //nvdebug(`  fieldGetNonRepeatableValue('${fieldToString(field)}', '${subfieldCode}') returns '${subfieldValues[0]}'`);
  return subfieldValues[0];
}

export function subfieldSetsAreEqual(fields1, fields2, subfieldCode) {
  // Called at least by 245$n/$p, 33X$b (field having exactly one instance of $b is checked elsewhere)
  const subfieldValues1 = fields1.map(field => getSubfieldValue(field, subfieldCode));
  const subfieldValues2 = fields2.map(field => getSubfieldValue(field, subfieldCode));
  // NB: This checks the order as well!
  return subfieldValues1.every((value, index) => value === subfieldValues2[index]);
}
