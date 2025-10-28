
import {hasFields, getSubfield, stripPunc} from './collectFunctions/collectUtils.js';


import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:partsAndSets:test');
const debugData = debug.extend('data');


export function getExtentsForPartsAndSets(record) {
  const f300s = hasFields('300', record, f300ToJSON);
  debug('Field 300 info: %o', f300s);
  return f300s;

  function f300ToJSON(field) {

    // Note: $a is repeatable, this should fetch all $a subfields
    // Repeated $a:s are pretty rare, though
    const extentString = getSubfield(field, 'a');
    debugData(`f300 $a: ${extentString}`);
    const extentArray = parseExtentString(extentString);
    const type = getExtentType(extentArray);

    const extent = {
      type,
      string: extentString,
      array: extentArray,
      additionalExtent: undefined
    };

    // we get the non-repeatable $e for additionla materials
    const additionalExtentString = getSubfield(field, 'e');
    debugData(`f300 $e: ${additionalExtentString}`);

    if (additionalExtentString && additionalExtentString !== 'undefined') {
      const additionalExtentArray = parseExtentString(additionalExtentString);
      const additionalType = getExtentType(additionalExtentArray);

      return {
        ...extent,
        additionalExtent: {
          string: additionalExtentString,
          array: additionalExtentArray,
          type: additionalType
        }
      };
    }
    return extent;
  }
}

export function getExtentType(extentArray) {
  debug(`Getting extentType from extentArray`);
  debugData(extentArray);
  const setTypeUnitsRegex = /vol|volumes|nidettä|osaa|band/iu;
  if (extentArray.some(extent => extent.amount > 1 && extent.unit.match(setTypeUnitsRegex))) {
    return 'set';
  }
  return 'unknown';
}


export function parseExtentString(extentString) {
  debug(`Handling extentString: |${extentString}|`);
  const punctlessString = stripPunc(extentString);
  debug(`Removed punctuation: |${punctlessString}|`);
  // get all extent-clauses like: "2 vol", "248 pages", "1 verkkoaineisto"
  // we probably should be able to handle also roman numerals to amount

  // \w does not match äåå?
  // should we handle X unit (Y unit2 Z unit3) cases somehow?
  //const regexpExtent = /(?<amount>\d+) (?<unit>[\w]+)/mgu;
  const regexpExtent = /(?<amount>\p{N}+) (?<unit>[\p{L}\p{N}-]+)/mgu;

  const foundExtents = [];
  for (const match of punctlessString.matchAll(regexpExtent)) {
    debug(`amount: ${match.groups.amount} unit: ${match.groups.unit}`);
    foundExtents.push({amount: match.groups.amount, unit: match.groups.unit});
  }

  debugData(JSON.stringify(foundExtents));
  return foundExtents;
}
