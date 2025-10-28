import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:compareUtils');
const debugDev = debug.extend('dev');
const debugData = debug.extend('data');


export function compareArrayContentRequireAll(arrayA, arrayB, prefix = '') {
  debugDev(`${prefix}"%o" vs "%o"`, arrayA, arrayB);
  // true: sets are equal
  // false: contents mismatch
  const normalizedArrayA = arrayA.map(value => normalizeStrings(value));
  const normalizedArrayB = arrayB.map(value => normalizeStrings(value));

  const onlyA = normalizedArrayA.filter(value => !normalizedArrayB.includes(value));
  const onlyB = normalizedArrayB.filter(value => !normalizedArrayA.includes(value));

  // Same content, different order (NB: true even when [ A, A, B ] vs [ B, B, A ]).
  // Anyway, close enough, and not sure which to prefer, thus return true:
  //debug(onlyA);
  //debug(onlyB);
  if (onlyA.length === 0 && onlyB.length === 0) {
    return true;
  }

  debugDev(`${prefix} Arrays A or B do not contain all values from each other`);
  return false;
}

export function compareStringToArray(string, array, prefix = '') {
  debugDev(`${prefix}"%o" vs "%o"`, string, array);
  // true: string found in array
  // false: string not found in array
  const normalizedString = normalizeStrings(string);
  const normalizedArray = array.map(value => normalizeStrings(value));

  const found = normalizedArray.filter(value => value === normalizedString);

  // Same content, different order (NB: true even when [ A, A, B ] vs [ B, B, A ]).
  // Anyway, close enough, and not sure which to prefer, thus return true:
  if (found.length > 0) {
    return true;
  }

  debugDev(`${prefix} Array does not contain string`);
  return false;
}

export function compareArrayContent(arrayA, arrayB, prefix = '' /*, ifOtherEmpty = false*/) {
  debugDev(`${prefix}"%o" vs "%o"`, arrayA, arrayB);
  // true: sets are equal
  // A: B is a subset of A - note: empty array is a subset of any non-empty array!
  // B: A is a subset of B - note: empty array is a subset of any non-empty array!
  // false: contents mismatch

  // NV: I don't think we really need ifOtherEmpty at all.
  // It was used with tags 042 and LOW.
  /*
  if (ifOtherEmpty && (arrayA.length===0||arrayB.length===0)) {
    if (arrayA.length > 0 && arrayB.length === 0) {
      return 'A';
    }

    if (arrayA.length === 0 && arrayB.length > 0) {
      debug('Array B contains values and A is empty');
      return 'B';
    }

    debug('Arrays A and B are both empty');
    return true;
  }
*/

  // Original version got the same units. That approach had issues, as
  // 1) the result was identical in both sets (as they were union)
  // 2) it produced unexpected results with { types: [ 's', 'n' ] } vs { types: [ 'n', 's' ] } as
  //    stringify() doesn't produce identical results for the above two.

  // Now: Filter out identical content:
  const onlyA = arrayA.filter(value => !arrayB.includes(value));
  const onlyB = arrayB.filter(value => !arrayA.includes(value));
  // Same content, different order (NB: true even when [ A, A, B ] vs [ B, B, A ]).
  // Anyway, close enough, and not sure which to prefer, thus return true:
  if (onlyA.length === 0) {
    return onlyB.length === 0 ? true : 'B';
  }
  if (onlyB.length === 0) {
    return 'A';
  }

  /*
  const union = arrayA.filter(value => arrayB.includes(value));
  if (arrayB.length > 0 && JSON.stringify(union) === JSON.stringify(arrayB)) {
    debug('Array A contains all values from B');
    return 'A';
  }
  if (arrayA.length > 0 && JSON.stringify(union) === JSON.stringify(arrayA)) {
    debug('Array B contains all values from A');
    return 'B';
  }
  */

  debugDev(`${prefix}Arrays A or B do not contain all values from each other`);
  return false;
}

const threshold = 0.6;
export function compareValueContent(valueA, valueB, prefix = '') {
  if (valueA === 'undefined' && valueB === 'undefined') {
    debugDev(`${prefix}Value A and B are "undefined"`);
    return 'undefined';
  }

  if (valueA === 'undefined') {
    debugDev(`${prefix}Value A is "undefined"`);
    return 'B';
  }

  if (valueB === 'undefined') {
    debugDev(`${prefix}Value B is "undefined"`);
    return 'A';
  }

  if (valueA === valueB) {
    debugDev(`${prefix}Value A and B are same`);
    return true;
  }

  const valueAContainsBAvg = compareStrings(valueA, valueB, prefix);
  const valueBContainsAAvg = compareStrings(valueB, valueA, prefix);

  if (valueAContainsBAvg === 1 && valueBContainsAAvg === 1) {
    debugDev(`${prefix}Normalized values of A and B are same: %o`, valueAContainsBAvg);
    return true;
  }

  // DEVELOP: if contain-% are same we return false!
  // This might be a good idea (for example part numbers?)

  if (valueAContainsBAvg > valueBContainsAAvg && valueAContainsBAvg > threshold) {
    debugDev(`${prefix}Value A contains %o of B`, valueAContainsBAvg);
    return 'A';
  }

  if (valueBContainsAAvg > valueAContainsBAvg && valueBContainsAAvg > threshold) {
    debugDev(`${prefix}Value B contains %o of A`, valueBContainsAAvg);
    return 'B';
  }

  debugDev(`${prefix}Value A contains %o of B`, valueAContainsBAvg);
  debugDev(`${prefix}Value B contains %o of A`, valueBContainsAAvg);
  debugDev(`${prefix}Minimum of ${threshold} did not happen setting: false`);

  return false;

  function compareStrings(stringCompareTo, stringToCompare, prefix = '') {
    const stringCompareToNormalizedLowerCase = normalizeStrings(stringCompareTo).toLowerCase();
    const stringToCompareNormalizedLowerCase = normalizeStrings(stringToCompare).toLowerCase();

    debugData(`${prefix}StringCompareTo: %o`, stringCompareToNormalizedLowerCase);
    debugData(`${prefix}StringToCompare: %o`, stringToCompareNormalizedLowerCase);

    const wordArray = stringToCompareNormalizedLowerCase.split(' ');
    const foundWords = wordArray.filter(word => stringCompareToNormalizedLowerCase.includes(word));

    const averageFoundWords = foundWords.length / wordArray.length;
    return averageFoundWords;
  }
}

function normalizeStrings(stringValue) {
  // decompose/precompose diacritics here
  const compNormalizedStringValue = String(stringValue).normalize('NFD');

  return compNormalizedStringValue
    .replace(/[^\w\s\p{Alphabetic}]/gu, '')
    .trim();
}
