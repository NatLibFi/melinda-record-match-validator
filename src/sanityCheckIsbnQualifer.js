/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2021-2023 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-record-match-validator
*
* melinda-record-match-validator program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-record-match-validator is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

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

function fieldsShareIsbn(field1, field2) {
  const subfields1 = field1.subfields.filter(sf => sf.code === 'a');
  const subfields2 = field2.subfields.filter(sf => sf.code === 'a');

  return subfields1.some(sf1 => subfields2.some(sf2 => sf1.value === sf2.value));

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
  const relevantOtherFields = otherFields.filter(f => fieldsShareIsbn(f, otherFields));
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


export function performIsbnQualifiercheck({record1, record2}) {
  const fields1 = record1.fields.filter(f => isRelevantField(f));
  const fields2 = record2.fields.filter(f => isRelevantField(f));
  if (fields1.length === 0 || fields2.length === 0) {
    return true;
  }

  return fields1.some(f => !hasConflinctingQualifier(f, fields2));
}

