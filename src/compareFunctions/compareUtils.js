import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:compareUtils');

export function compareArrayContent(arrayA, arrayB, ifOtherEmpty = false) {
  if (JSON.stringify(arrayA) === JSON.stringify(arrayB)) {
    debug('Array A and B are same');
    return true;
  }

  const arrayBContainsFromA = arrayA.filter(value => arrayB.includes(value));
  const arrayAContainsFromB = arrayB.filter(value => arrayA.includes(value));

  if (arrayB.length > 0 && JSON.stringify(arrayAContainsFromB) === JSON.stringify(arrayB)) {
    debug('Array A contains all values from B');
    return 'A';
  }

  if (arrayA.length > 0 && JSON.stringify(arrayBContainsFromA) === JSON.stringify(arrayA)) {
    debug('Array B contains all values from A');
    return 'B';
  }

  if (ifOtherEmpty) {
    if (arrayA.length > 0 && arrayB.length === 0) {
      debug('Array A contains values and B is empty');
      return 'A';
    }

    if (arrayA.length === 0 && arrayB.length > 0) {
      debug('Array B contains values and A is empty');
      return 'B';
    }

    debug('Array A or B both contains different values');
    return false;
  }


  debug('Array A or B does not contain all values from other');
  return false;
}

export function compareValueContent(valueA, valueB) {
  if (valueA === 'undefined' && valueB === 'undefined') {
    debug('Value A and B are "undefined"');
    return 'undefined';
  }

  if (valueA === 'undefined') {
    debug('Value A is "undefined"');
    return 'B';
  }

  if (valueB === 'undefined') {
    debug('Value B is "undefined"');
    return 'A';
  }

  if (valueA === valueB) {
    debug('Value A and B are same');
    return true;
  }

  const valueAContainsBAvg = compareStrings(valueA, valueB);
  const valueBContainsAAvg = compareStrings(valueB, valueA);

  if (valueAContainsBAvg === 1 && valueBContainsAAvg === 1) {
    debug('Normalized values of A and B are same', valueAContainsBAvg);
    return true;
  }

  if (valueAContainsBAvg > valueBContainsAAvg && valueAContainsBAvg > 0.5) {
    debug('Value A contains %o of B', valueAContainsBAvg);
    return 'A';
  }

  if (valueBContainsAAvg > valueAContainsBAvg && valueBContainsAAvg > 0.5) {
    debug('Value B contains %o of A', valueBContainsAAvg);
    return 'B';
  }

  debug('Value A contains %o of B', valueAContainsBAvg);
  debug('Value B contains %o of A', valueBContainsAAvg);
  debug('Minimium of 0.5 did not happen setting: false');

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
