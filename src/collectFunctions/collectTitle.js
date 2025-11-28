import createDebugLogger from 'debug';
//import {nvdebug} from '../utils.js';
import {hasFields, getSubfield, getSubfields, removeExtraSpaces, stripPunc} from './collectUtils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:title');
const debugData = debug.extend('data');

// Compare titles from 245 betweeen records.
// Compare f245 to f946
// Compare f245 t0 combinations of f490+f245

// DEVELOP: could set preference for record with more complex title structure

// type: {
//   validation: true,
//   preference: false
// }

export function getAllTitleFeatures(record) {
  return {
    titleFeatures: getTitleFeatures(record),
    seriesFeatures: getSeriesFeatures(record),
    f946Features: get946Features(record)
  };
}

export function getTitleFeatures(record) {
  // we have just one f245
  const [f245] = hasFields('245', record, titleFieldToJSON);
  debugData('Field 245 info: %o', f245);
  return f245;
}

export function get946Features(record) {
  const f946Data = hasFields('946', record, titleFieldToJSON);
  debugData('Field 946 info: %o', JSON.stringify(f946Data));

  return f946Data;

}

function titleFieldToJSON(field) {
  const title = cleanValue(getSubfield(field, 'a'));
  const remainderOfTitle = cleanValue(getSubfield(field, 'b'));
  // Note: get all subfields $p & $n
  const numbersOfPartInSectionOfAWork = getSubfields(field, 'n').map(sf => cleanValue(sf));
  const namesOfPartInSectionOfAWork = getSubfields(field, 'p').map(sf => cleanValue(sf));

  return {title, remainderOfTitle, numbersOfPartInSectionOfAWork, namesOfPartInSectionOfAWork};
}

export function getSeriesFeatures(record) {
    const fields490 = record.get('490');
    return fields490.map(f => f490ToJSON(f));

    /*
  const f490Data = hasFields('490', record, f490ToJSON);
  debugData('Field 490 info: %o', JSON.stringify(f490Data));
*/
  return f490Data;

  function f490ToJSON(field) {
    const seriesTitle = cleanValue(getSubfield(field, 'a'));
    const seriesNumber = cleanValue(getSubfield(field, 'v')); // Do we want

    return {seriesTitle, seriesNumber};
  }
}

function cleanValue(value) {
  return removeExtraSpaces(stripPunc(value));
}
