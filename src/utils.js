//import {getSubfieldValue/*, getSubfieldValues*/} from './collectFunctions/collectUtils';

export function nvdebug(message, debug = undefined) {
  console.info(message); // eslint-disable-line no-console
  if (debug) {
    debug(message);
    return;
  }
}

/*
const validValuesForSubfield = {
  '336‡b': ['prm', 'tdi', 'tdm', 'ntm', 'spw', 'sti', 'txt', 'snd'],
  '336‡2': ['rdacontent'],
  '337‡b': ['c', 'e', 'g', 'h', 'n', 'p', 's', 'v', 'x', 'z'],
  '337‡2': ['rdamedia'],
  '338‡b': ['ca', 'cb', 'cd', 'ce', 'cf', 'ch', 'ck', 'cr', 'cz', 'eh', 'es', 'ez', 'gc', 'gd', 'gf', 'gs', 'gt', 'ha', 'hb', 'hc', 'hd', 'he', 'hf', 'hg', 'hh', 'hj', 'hz', 'mc', 'mf', 'mo', 'mr', 'mz', 'na', 'nb', 'nc', 'nn', 'no', 'nr', 'nz', 'pp', 'pz', 'sd', 'ss', 'st', 'sz', 'vc', 'vd', 'vf', 'vr', 'vz', 'zu'],
  '338‡2': ['rdacarrier']
};
*/

/*
export function fieldToString(f) {
  if ('subfields' in f) {
    return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;
  }
  return `${f.tag}    ${f.value}`;
  function formatSubfields(field) {
    return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
  }
}
*/
/*
export function isControlSubfieldCode(subfieldCode) {
  if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'w'].includes(subfieldCode)) {
    return true;
  }
  return false;
}
*/
/*
export function fieldHasSubfield(field, subfieldCode, subfieldValue = null) {
  if (subfieldValue === null) {
    return field.subfields.some(sf => sf.code === subfieldCode);
  }
  return field.subfields.some(sf => sf.code === subfieldCode && subfieldValue === sf.value);
}
*/
/*
export function fieldHasValidNonRepeatableSubfield(field, subfieldCode) {
  const unique Value = fieldGetNonRepeatableValue(field, subfieldCode);
  if (uniqueValue === null) {
    nvdebug(`fieldHasValidNonRepeatableSubfield() returns false`);
    return false;
  }
  //nvdebug(`fieldHasValidNonRepeatableSubfield() returns true`);
  return true;
}
*/

/*
export function fieldGetNonRepeatableValue(field, subfieldCode) {
  //nvdebug(` fieldGetNonRepeatableValue('${fieldToString(field)}', '${subfieldCode}') in...`);
  const subfieldValues = getSubfieldValues(field, subfieldCode);
  if (subfieldValues.length !== 1) { // require exactly one instance exists
    nvdebug(`  ${field.tag}‡${subfieldCode}: ${subfieldValues.length} subfields found`);
    return null;
  }

  // Disable sanity checks, as these are not used by relevant fields currently:

  //const key = `${field.tag}‡${subfieldCode}`;
  //if (key in validValuesForSubfield) {
  //  if (!validValuesForSubfield[key].includes(subfieldValues[0])) {
  //    nvdebug(`  fieldGetNonRepeatableValue() return null ('${subfieldValues[0]}' not found in '${validValuesForSubfield[key].join('/')}')`);
  //    return null;
  //  }
  //}


  //nvdebug(`  fieldGetNonRepeatableValue('${fieldToString(field)}', '${subfieldCode}') returns '${subfieldValues[0]}'`);
  return subfieldValues[0];
}
*/

/*
export function subfieldSetsAreEqual(fields1, fields2, subfieldCode) {
  // Called at least by 245$n/$p, 33X$b (field having exactly one instance of $b is checked elsewhere)
  const subfieldValues1 = fields1.map(field => getSubfieldValue(field, subfieldCode));
  const subfieldValues2 = fields2.map(field => getSubfieldValue(field, subfieldCode));
  // NB: This checks the order as well!
  return subfieldValues1.every((value, index) => value === subfieldValues2[index]);
}
*/

/*
export function isComponentPart(record) {
  if (['a', 'b', 'd'].includes(record.leader[7])) { // LDR/07 is the bibliographical level
    return true;
  }
  // Should having a 773 (or 973) field imply that record is a component part?
  return false;
}
*/

function getMelindaDefaultPrefix() {
  return '(FI-MELINDA)';
}

export function normalizeMelindaId(value) {
  // NB! melindaPrefix is referred to in compareFunctions/fields.js!
  // We should configure this somewhere on a lower level.
  const melindaPrefix = getMelindaDefaultPrefix();
  if ((/^FCC[0-9]{9}$/u).test(value)) {
    return `${melindaPrefix}${value.substring(3)}`;
  }
  if ((/^\(FIN01\)[0-9]{9}$/u).test(value)) {
    return `${melindaPrefix}${value.substring(7)}`;
  }
  if ((/^\(FI-MELINDA\)[0-9]{9}$/u).test(value)) {
    return `${melindaPrefix}${value.substring(12)}`;
  }

  return value;
}

/*
export function isValidMelindaId(value = '') {
  const normalizedValue = normalizeMelindaId(value);
  if (!(/.0[0-9]{8}$/u).test(normalizedValue)) {
    nvdebug(`${value} is not a (valid) Melinda ID`);
    return false;
  }
  const prefix = normalizedValue.slice(0, -9);
  if (prefix !== getMelindaDefaultPrefix()) {
    nvdebug(`Melinda prefix mismatch '${prefix}' vs '${getMelindaDefaultPrefix()}'`);
    return false;
  }
  return true;
}
*/

/*
export function getMelindaId(value = '') {
  if (isValidMelindaId(value)) {
    return value.slice(-9);
  }
  return undefined;
}
*/

function getIdPrefix(id) {
  const i = id.indexOf(')');
  if (i === -1) {
    return '';
  }
  return id.substring(0, i + 1);
}

export function hasIdMismatch(otherId, idSet) {
  const otherPrefix = getIdPrefix(otherId);
  return idSet.some(id => {
    if (id === otherId) { // Identical values: no mismatch
      //nvdebug(`SAME VALUE CAUSES APPROVAL: ${id}`);
      return false;
    }
    const prefix = getIdPrefix(id); // Identical prefix: has mismatch
    if (prefix === otherPrefix) {
      //nvdebug(`SAME PREFIX CAUSES MISMATCH: ${prefix} WITH '${id}' vs '${otherId}'`);
      return true;
    }
    //nvdebug(`UNRELATED CAUSES APPROVAL: '${id}' vs '${otherId}'`);
    return false; // No mismatch
  });
}


