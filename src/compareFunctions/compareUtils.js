import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:compareUtils');

export function compareArrayContent(arrayA, arrayB /*, ifOtherEmpty = false*/) {
  debug('"%o" vs "%o"', arrayA, arrayB);
  // true: sets are equal
  // A: B is a subset of A
  // B: A is a sibset of B
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

  debug('Arrays A or B do not contain all values from each other');
  return false;
}

const threshold = 0.5;
export function compareValueContent(valueA, valueB, prefix = '') {
  if (valueA === 'undefined' && valueB === 'undefined') {
    debug(`${prefix}Value A and B are "undefined"`);
    return 'undefined';
  }

  if (valueA === 'undefined') {
    debug(`${prefix}Value A is "undefined"`);
    return 'B';
  }

  if (valueB === 'undefined') {
    debug(`${prefix}Value B is "undefined"`);
    return 'A';
  }

  if (valueA === valueB) {
    debug(`${prefix}Value A and B are same`);
    return true;
  }

  const valueAContainsBAvg = compareStrings(valueA, valueB);
  const valueBContainsAAvg = compareStrings(valueB, valueA);

  if (valueAContainsBAvg === 1 && valueBContainsAAvg === 1) {
    debug('Normalized values of A and B are same: %o', valueAContainsBAvg);
    return true;
  }

  if (valueAContainsBAvg > valueBContainsAAvg && valueAContainsBAvg > threshold) {
    debug('Value A contains %o of B', valueAContainsBAvg);
    return 'A';
  }

  if (valueBContainsAAvg > valueAContainsBAvg && valueBContainsAAvg > threshold) {
    debug('Value B contains %o of A', valueBContainsAAvg);
    return 'B';
  }

  debug('Value A contains %o of B', valueAContainsBAvg);
  debug('Value B contains %o of A', valueBContainsAAvg);
  debug(`${prefix}Minimium of ${threshold} did not happen setting: false`);

  return false;

  function compareStrings(stringCompareTo, stringToCompare) {
    const stringCompareToNormalizedLowerCase = normalizeStrings(stringCompareTo).toLowerCase();
    const stringToCompareNormalizedLowerCase = normalizeStrings(stringToCompare).toLowerCase();

    debug('StringCompareTo: %o', stringCompareToNormalizedLowerCase);
    debug('StringToCompare: %o', stringToCompareNormalizedLowerCase);

    const wordArray = stringToCompareNormalizedLowerCase.split(' ');
    const foundWords = wordArray.filter(word => stringCompareToNormalizedLowerCase.includes(word));

    const averageFoundWords = foundWords.length / wordArray.length;
    return averageFoundWords;
  }

  function normalizeStrings(stringValue) {
    return stringValue
      .replace(/[^\w\s\p{Alphabetic}]/gu, '')
      .trim();
  }
}
