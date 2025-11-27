
// Handle fields 336, 337 and 338.

import createDebugLogger from 'debug';
import {compareArrayContent} from './compareUtils.js';
import { get33Xb } from '../collectFunctions/collectUtils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field33X');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');



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

