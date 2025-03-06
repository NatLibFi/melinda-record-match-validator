
import createDebugLogger from 'debug';
//import {nvdebug} from '../utils';
import {hasFields, getSubfield, getSubfields, stripPunc} from './collectFunctions/collectUtils';
import {compareValueContent, compareArrayContentRequireAll} from './compareFunctions/compareUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:title');

// NOTE: do not use with field245 -matchValidator

// Compare titles betweeen records.
// f245, f946, combinations of f490+f245

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
  debug('Field 245 info: %o', f245);
  return f245;
}

export function get946Features(record) {
  const f946Data = hasFields('946', record, titleFieldToJSON);
  debug('Field 946 info: %o', JSON.stringify(f946Data));

  return f946Data;

}

function titleFieldToJSON(field) {
  const title = stripPunc(getSubfield(field, 'a'));
  const remainderOfTitle = stripPunc(getSubfield(field, 'b')); // Do we want
  // Note: get all subfields $p & $n
  const numbersOfPartInSectionOfAWork = getSubfields(field, 'n').map(sf => stripPunc(sf));
  const namesOfPartInSectionOfAWork = getSubfields(field, 'p').map(sf => stripPunc(sf));

  return {title, remainderOfTitle, numbersOfPartInSectionOfAWork, namesOfPartInSectionOfAWork};
}

export function getSeriesFeatures(record) {
  const f490Data = hasFields('490', record, f490ToJSON);
  debug('Field 490 info: %o', JSON.stringify(f490Data));

  return f490Data;

  function f490ToJSON(field) {
    const seriesTitle = stripPunc(getSubfield(field, 'a'));
    const seriesNumber = stripPunc(getSubfield(field, 'v')); // Do we want

    return {seriesTitle, seriesNumber};
  }
}

/// -------

export function compareAllTitleFeatures(recordValuesA, recordValuesB) {
  //debug(recordValuesA);
  const titleA = recordValuesA.title;
  const titleB = recordValuesB.title;
  debug('%o vs %o', titleA, titleB);
  const result = compareTitleFeatures(titleA, titleB);
  return checkTitleComparisonResult(result);
}

function compareTitleFeatures(titleA, titleB) {
  // DEVELOP: add comparisons for other title features

  // 245 == 946 OK
  // 490 + 245 = 245 OK
  //

  // f946 features

  //  {
  //  titleFeatures: {title: 'Piiloleikki', remainderOfTitle: 'undefined', numbersOfPartInSectionOfAWork: [], namesOfPartInSectionOfAWork: []},
  //  seriesFeatures: [
  //    {seriesTitle: 'Vauva tunnustelee', seriesNumber: 'undefined'}
  //  ],
  //  f946Features: [
  //      { title: 'Vauva tunnustelee', remainderOfTitle: 'Piiloleikki', numbersOfPartInSectionOfAWork: [], namesOfPartInSectionOfAWork: [] } ] }
  //  }

  debug(JSON.stringify(titleA.titleFeatures.nameOfPartInSectionOfAWork));
  const titleFeaturesResult = {
    'nameOfPartInSectionOfAWork': compareArrayContentRequireAll(titleA.titleFeatures.namesOfPartInSectionOfAWork, titleB.titleFeatures.namesOfPartInSectionOfAWork, '245 name: '),
    'numberOfPartInSectionOfAWork': compareArrayContentRequireAll(titleA.titleFeatures.numbersOfPartInSectionOfAWork, titleB.titleFeatures.numbersOfPartInSectionOfAWork, '245 number: '),
    'title': compareValueContent(titleA.titleFeatures.title, titleB.titleFeatures.title, '245 title: ')
  };
  debug(titleFeaturesResult);
  return titleFeaturesResult;
}

function checkTitleComparisonResult(result) {
  // DEVELOP check other title features
  // if any of comparison results is false?
  if (result.title === false || result.numberOfPartInSectionOfAWork === false || result.nameOfPartInSectionOfAWork === false) {
    return false;
  }
  // Room for 'A' and 'B'?
  return true;
}

export function checkAllTitleFeatures({record1, record2}) {
  const recordValuesA = {
    title: getAllTitleFeatures(record1)
  };
  const recordValuesB = {
    title: getAllTitleFeatures(record2)
  };

  return compareAllTitleFeatures(recordValuesA, recordValuesB);
}

