//import createDebugLogger from 'debug';
//import {fieldToString} from '@natlibfi/melinda-marc-record-merge-reducers/dist/reducers/utils';
//import {nvdebug} from '../utils';
//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:collectFields');

export function hasFields(tag, record, useFunction, useFunctionParameters) {
  const fields = record.get(tag);
  if (fields === []) {
    return [];
  }

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

export function getFirstField(tag, record) {
  const fields = record.get(tag);
  if (fields.length === 0) {
    return null;
  }
  return fields[0];
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
