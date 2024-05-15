import ISBN from 'isbn3';
//import createDebugLogger from 'debug';
//import {nvdebug} from './utils';

//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:sanityCheckIsbnQualifier');


function mapQualifier(value) {
  // Try to map 020$q value to a group
  if (value.match(/epub/iu)) {
    return 'EPUB';
  }
  if (value.match(/pdf/iu)) {
    return 'PDF';
  }
  if (value.match(/^(?:hft|häftad|mjuka pärmar|nid|paperback|pehmeäkantinen)/ui)) {
    return 'PEHMEÄKANTINEN';
  }
  if (value.match(/^(?:hard.?cover|hårda pärmar|kovakantinen|sid)/ui)) {
    return 'KOVAKANTINEN';
  }
  return undefined;

}

function normalizeIsbn(value) {
  const normalizedValue = value.replace(/x/u, 'X').replace(/-/ug, '');
  if (normalizedValue.length !== 10 && normalizedValue.length !== 13) {
    return value; // Not an ISBN. Return the original value.
  }

  const auditResult = ISBN.audit(normalizedValue);
  if (!auditResult.validIsbn) {
    return value;
  }

  const parsedIsbn = ISBN.parse(normalizedValue);
  //nvdebug(`NORM ${value} TO ${parsedIsbn.isIsbn10}`);
  return parsedIsbn.isbn10;
}

function fieldsShareIsbn(field1, field2) {
  const isbns1 = field1.subfields.filter(sf => sf.code === 'a' && sf.value !== undefined).map(sf => normalizeIsbn(sf.value));
  const isbns2 = field2.subfields.filter(sf => sf.code === 'a' && sf.value !== undefined).map(sf => normalizeIsbn(sf.value));

  //nvdebug(`1: ${isbns1.join(' -- ')}`);
  //nvdebug(`2: ${isbns2.join(' -- ')}`);


  return isbns1.some(v1 => isbns2.some(v2 => v1 === v2));

}

function hasConflictingQualifierTypes(type1, type2) {
  return type1 !== undefined && type2 !== undefined && type1 !== type2;
}

function fieldHaveConflictingQualifiers(field1, field2) {
  const qualifierTypes1 = field1.subfields.filter(sf => sf.code === 'q').map(sf => mapQualifier(sf.value));
  const qualifierTypes2 = field2.subfields.filter(sf => sf.code === 'q').map(sf => mapQualifier(sf.value));

  return qualifierTypes1.some(type1 => qualifierTypes2.some(type2 => hasConflictingQualifierTypes(type1, type2)));
}

function hasConflinctingQualifier(field, otherFields) {
  const relevantOtherFields = otherFields.filter(field2 => fieldsShareIsbn(field, field2));
  if (relevantOtherFields.length === 0) {
    return false; // No shared ISBNs -> no conflict
  }
  return relevantOtherFields.some(field2 => fieldHaveConflictingQualifiers(field, field2));
}

function isRelevantField(field) {
  if (field.tag !== '020') {
    return false;
  }

  return field.subfields.some(sf => sf.code === 'a') && field.subfields.some(sf => sf.code === 'q');
}


export function performIsbnQualifierCheck({record1, record2}) {
  const fields1 = record1.fields.filter(f => isRelevantField(f));
  const fields2 = record2.fields.filter(f => isRelevantField(f));
  if (fields1.length === 0 || fields2.length === 0) {
    return true;
  }

  return fields1.some(f => !hasConflinctingQualifier(f, fields2));
}

