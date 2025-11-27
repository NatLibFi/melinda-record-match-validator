//import createDebugLogger from 'debug';
//import {nvdebug} from '../utils.js';
//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:collectFields');

export function hasFields(tag, record, useFunction, useFunctionParameters) {
  const fields = record.get(tag);

  if (useFunction !== undefined) {
    //const result = fields.map(field => useFunction(field, useFunctionParameters));

    return fields.map(field => useFunction(field, useFunctionParameters));
  }

  return fields;
}

export function hasField(tag, record, useFunction, useFunctionParameters) {
  const fields = record.get(tag);
  if (fields.length === 0) {
    return [];
  }

  if (useFunction !== undefined) {
    return useFunction(fields[0], useFunctionParameters);
  }

  return [fields[0]];
}

export function getDefaultMissValue() {
  return 'undefined';
}
// Check 773 multiple sub code w & g
// Check 245 multiple sub code n & p
// Check 042 multiple sub code a

export function getSubfield(field, subfieldCode) {
  const [value] = field.subfields.filter(sub => sub.code === subfieldCode).map(sub => sub.value);

  if (value === undefined) {
    return getDefaultMissValue();
  }

  return value;
}

export function getSubfields(field, subfieldCode) {
  return field.subfields.filter(sub => sub.code === subfieldCode).map(sub => sub.value);
}

export function getSubfieldValue(field, subfieldCode) {
  const values = field.subfields.filter(sub => sub.code === subfieldCode).map(sub => sub.value);
  if (values.length === 0) {
    return null;
  }
  return values[0];
}

export function getSubfieldValues(field, subfieldCode) {
  if (!field.subfields) { // sanityCheck
    return [];
  }
  return field.subfields.filter(sub => sub.code === subfieldCode).map(sub => sub.value);
}

export function stripPunc(value) {
  return value.replace(/(?: [=;:/]|[.,])$/u, '');
}

export function removeExtraSpaces(value) {
  return value.replace(/ +/u, ' ');
}

// In a wrong place, but I'm not adding a file for a one-liner:
export function get042(record) {
  return hasField('042', record, getSubfields, 'a');
}

// 245 n & p
// tosin nää ei varmaan kuitenkaan tuu onixista, eli KV:n ennakkotietotapauksessa toi blokkais kaikki, joissa Melindassa olis tehty noi valmiiksi nimekkeeseen
// niissä tapauksissa, joissa tuodaan alunperin marc21-kirjastodataa tai yhdistetään Melindan tietueita, tää on oleellisehko
export function get245(record) {
  const [f245] = hasFields('245', record, f245ToJSON);
  //debugDev('Field 245 info: %o', f245);

  return f245;

  function f245ToJSON(field) {
    const title = stripPunc(getSubfield(field, 'a'));
    const remainderOfTitle = stripPunc(getSubfield(field, 'b')); // Do we want
    // Note: both $p and $n are repeatable, we get only first instances of them here?
    const numberOfPartInSectionOfAWork = stripPunc(getSubfield(field, 'n'));
    const nameOfPartInSectionOfAWork = stripPunc(getSubfield(field, 'p'));

    return {title, remainderOfTitle, numberOfPartInSectionOfAWork, nameOfPartInSectionOfAWork};
  }
}

// Collect SID
export function getSID(record) {
  const SIDs = hasFields('SID', record).map(field => sidToJson(field));
  //debugDev('SIDs: %o', SIDs);

  return SIDs;

  function sidToJson(sid) {
    const [database] = sid.subfields.filter(sub => sub.code === 'b').map(sub => sub.value);
    const [id] = sid.subfields.filter(sub => sub.code === 'c').map(sub => sub.value);

    return {id, database};
  }
}

// COLLECT:
export function get33Xb(record, tag) {
  const types = hasFields(tag, record, getSubfield, 'b');
  //debugDev('Field %s types: %o', tag, types);
  //nvdebug(`NV Field ${tag} has types: ${types.join(', ')}`, debugDev);
  return {types};
}

export function get336bContentType(record) { // Test-only
  return get33Xb(record, '336');
}

export function get337bMediaType(record) { // Test-only
  return get33Xb(record, '337');
}

export function get338bCarrierType(record) { // Test-only
  // A component part should not have a 338 field. However, I don't think we need this sanity check...
  return get33Xb(record, '338');
}

