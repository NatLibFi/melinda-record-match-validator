
// Handle fields 336, 337 and 338.

import createDebugLogger from 'debug';
import {/*fieldHasValidNonRepeatableSubfield, */ nvdebug/*, subfieldSetsAreEqual*/} from './utils.js';
import {hasFields, getSubfield} from './collectFunctions/collectUtils.js';
import {compareArrayContent} from './compareFunctions/compareUtils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field33X');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

// COLLECT:
function get33Xb(record, tag) {
  const types = hasFields(tag, record, getSubfield, 'b');
  debugDev('Field %s types: %o', tag, types);
  nvdebug(`NV Field ${tag} has types: ${types.join(', ')}`, debugDev);
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


/*
336, 337, 338 $b:t
  automaatiolla pitää miettiä jotain parempaa logiikkaa - mut tekstiaineistoissa jos toinen tietue on 337 $b c ja toinen on 337 $b n niin yhdistämistä ei saa tehdä.
  (Tietokonekäyttöinen teksti ja fyysinen teksti)
*/

function compare33XType(recordValuesA, recordValuesB, tag) {
  const f33XA = recordValuesA[tag];
  const f33XB = recordValuesB[tag];
  debugDev('%s type(s): %o vs %o', tag, f33XA, f33XB);

  return compareArrayContent(f33XA.types, f33XB.types);
}

// COMPARE TESTS:
export function compare336ContentType(recordValuesA, recordValuesB) {
  return compare33XType(recordValuesA, recordValuesB, '336');
}

export function compare337MediaType(recordValuesA, recordValuesB) {
  return compare33XType(recordValuesA, recordValuesB, '337');
}

export function compare338CarrierType(recordValuesA, recordValuesB) {
  return compare33XType(recordValuesA, recordValuesB, '338');
}

/// BOTH:
function check33X(record1, record2, tag) {
  const data1 = get33Xb(record1, tag);
  const data2 = get33Xb(record2, tag);
  debugDev('CC Field %s types: %o vs %o', tag, data1, data2);
  return compareArrayContent(data1.types, data2.types);
  //return compare336ContentType(data1, data2);
}

export function check336({record1, record2}) { //
  return check33X(record1, record2, '336');
}

export function check337({record1, record2}) {
  return check33X(record1, record2, '337');
}

export function check338({record1, record2}) {
  return check33X(record1, record2, '338');
}

