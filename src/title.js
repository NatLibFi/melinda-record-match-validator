import createDebugLogger from 'debug';
//import {nvdebug} from '../utils';
import {hasFields, getSubfield, getSubfields, stripPunc, removeExtraSpaces} from './collectFunctions/collectUtils';
import {compareValueContent, compareArrayContentRequireAll, compareStringToArray} from './compareFunctions/compareUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:title');
const debugDev = debug.extend('dev');
const debugData = debug.extend('data');

// NOTE: do not use with field245 -matchValidator - these do partly same things

// Compare titles from 245 betweeen records.
// Compare f245 to f946
// Compare f245 t0 combinations of f490+f245

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
  const f490Data = hasFields('490', record, f490ToJSON);
  debugData('Field 490 info: %o', JSON.stringify(f490Data));

  return f490Data;

  function f490ToJSON(field) {
    const seriesTitle = cleanValue(getSubfield(field, 'a'));
    const seriesNumber = cleanValue(getSubfield(field, 'v')); // Do we want

    return {seriesTitle, seriesNumber};
  }
}

/// -------

//  {
//  titleFeatures: {title: 'Piiloleikki', remainderOfTitle: 'undefined', numbersOfPartInSectionOfAWork: [], namesOfPartInSectionOfAWork: []},
//  seriesFeatures: [
//    {seriesTitle: 'Vauva tunnustelee', seriesNumber: 'undefined'}
//  ],
//  f946Features: [
//      { title: 'Vauva tunnustelee', remainderOfTitle: 'Piiloleikki', numbersOfPartInSectionOfAWork: [], namesOfPartInSectionOfAWork: [] } ] }
//  }


export function compareAllTitleFeatures(recordValuesA, recordValuesB) {
  //debug(recordValuesA);
  const titleA = recordValuesA.title;
  const titleB = recordValuesB.title;
  debugData('%o vs %o', titleA, titleB);
  const result = compareTitleFeatures(titleA, titleB);
  return checkTitleComparisonResult(result);
}

function compareTitleFeatures(titleA, titleB) {

  if (titleA.titleFeatures === undefined || titleB.titleFeatures === undefined) {
    return checkUndefinedTitle(titleA.titleFeatures, titleB.titleFeaturesB);
  }

  // Compare 245 $a + $b + $n + $p
  const combinedFeaturesA = combineTitleFeatures(titleA.titleFeatures);
  const combinedFeaturesB = combineTitleFeatures(titleB.titleFeatures);
  const combinedFeaturesResult = compareValueContent(combinedFeaturesA, combinedFeaturesB, '245-combined: ');
  debugData(`CombinedFeatures: ${JSON.stringify(combinedFeaturesResult)}`);

  // We do not need to do more checking if 245 is a total match
  // Note: we can also get non-false "A" or "B" if one record's combined features is a subset of another records combined features
  if (combinedFeaturesResult === true) {
    return {
      'combinedFeatures': combinedFeaturesResult
    };
  }

  // NOTE: this is not used!
  const combinedTitleResult = compareCombinedTitle(titleA, titleB);
  debugData(`CombinedTitle: ${JSON.stringify(combinedFeaturesResult)}`);
  const f946Result = compareWith946(titleA, titleB, combinedFeaturesA, combinedFeaturesB);
  debugData(`F946: ${JSON.stringify(f946Result)}`);
  const seriesResult = compareWith490(titleA, titleB, combinedFeaturesA, combinedFeaturesB);
  debugData(`Series: ${JSON.stringify(seriesResult)}`);

  const titleFeaturesResult = {
    'combinedFeatures': combinedFeaturesResult,
    'combinedTitle': combinedTitleResult,
    'f946': f946Result,
    'series': seriesResult,
    'nameOfPartInSectionOfAWork': compareArrayContentRequireAll(titleA.titleFeatures.namesOfPartInSectionOfAWork, titleB.titleFeatures.namesOfPartInSectionOfAWork, '245 name: '),
    'numberOfPartInSectionOfAWork': compareArrayContentRequireAll(titleA.titleFeatures.numbersOfPartInSectionOfAWork, titleB.titleFeatures.numbersOfPartInSectionOfAWork, '245 number: '),
    // Note: we can also get non-false "A" or "B" if one record's title is a subset of another record's title
    'title': compareValueContent(titleA.titleFeatures.title, titleB.titleFeatures.title, '245 title: ')
  };
  //debug(titleFeaturesResult);
  return titleFeaturesResult;
}

function checkUndefinedTitle(titleFeaturesA, titleFeaturesB) {

  // Fail matchValidation if one of the records is missing title
  if (titleFeaturesA === undefined || titleFeaturesB === undefined) {
    return {
      'undefinedTitleFeatures': false
    };
  }

  // We could also prefer record with existing title
  /*

  if (titleFeaturesA === undefined && titleFeaturesB === undefined) {
    return {
      'undefinedTitleFeatures': false
    };
  }

  if (titleFeaturesA === undefined && titleFeaturesB !== undefined) {
    return {
      'undefinedTitleFeatures': 'B'
    };
  }

  if (titleFeaturesA !== undefined && titleFeaturesB === undefined) {
    return {
      'undefinedTitleFeatures': 'A'
    };
  }
  */

  return {
    'undefinedTitleFeatures': true
  };
}

// 245 $a + $b + $p's + $n's
function combineTitleFeatures(titleFeatures) {
  return `${titleFeatures.title}${titleFeatures.remainderOfTitle === 'undefined' ? '' : ' '.concat(titleFeatures.remainderOfTitle)}${titleFeatures.namesOfPartInSectionOfAWork.length > 0 ? ' '.concat(titleFeatures.namesOfPartInSectionOfAWork.join(' ')) : ''}${titleFeatures.numbersOfPartInSectionOfAWork.length > 0 ? ' '.concat(titleFeatures.numbersOfPartInSectionOfAWork.join(' ')) : ''}`;
}

// 245 $a + $b
function combineTitle(titleFeatures) {
  return `${titleFeatures.title}${titleFeatures.remainderOfTitle === 'undefined' ? '' : ' '.concat(titleFeatures.remainderOfTitle)}`;
}

// compare 245 $a + $b to 245 $a + $b
// DEVELOP: we could compare 245 $a to 245 $a + $b
function compareCombinedTitle(titleA, titleB) {
  const combinedTitleA = combineTitle(titleA.titleFeatures);
  const combinedTitleB = combineTitle(titleB.titleFeatures);
  const combinedTitleResult = compareValueContent(combinedTitleA, combinedTitleB, '245-$a+$b: ');
  debugData(`combinedTitleResult: ${JSON.stringify(combinedTitleResult)}`);
  return combinedTitleResult;
}

// compare 245 to 946s
function compareWith946(titleA, titleB, combinedFeaturesA, combinedFeaturesB) {

  //debug(titleA.f946Features);
  const combined946FeaturesA = combineF946Features(titleA);
  debugData(`F946A: ${JSON.stringify(combined946FeaturesA)}`);

  //debug(titleB.f946Features);
  const combined946FeaturesB = combineF946Features(titleB);
  debugData(`F946B: ${JSON.stringify(combined946FeaturesB)}`);

  //debug(`Running f946 comparison`);
  const compareToF946Result = compareStringToArray(combinedFeaturesA, combined946FeaturesB, 'A:245 to B:946: ') || compareStringToArray(combinedFeaturesB, combined946FeaturesA, 'B:245 to A:946: ');
  debugData(`F946 comparison result: ${JSON.stringify(compareToF946Result)}`);
  return compareToF946Result ? compareToF946Result : undefined;

  function combineF946Features(title) {
    //debug(title);
    return title.f946Features.map((f946Features) => combineTitleFeatures(f946Features));
  }


}

// compare 245 to 245+490 combinations
function compareWith490(titleA, titleB, combinedFeaturesA, combinedFeaturesB) {

  const combined490TitlesA = combine490Titles(combinedFeaturesA, titleA.seriesFeatures);
  debugData(`F490: ${JSON.stringify(combined490TitlesA)}`);

  const combined490TitlesB = combine490Titles(combinedFeaturesB, titleB.seriesFeatures);
  debugData(`F490: ${JSON.stringify(combined490TitlesB)}`);

  //debug(`Running series comparison`);
  const compareTo490Result = compareStringToArray(combinedFeaturesA, combined490TitlesB, 'A:245 to B:245+490: ') || compareStringToArray(combinedFeaturesB, combined490TitlesA, 'B:245 to A:245+490: ');
  debugData(`F490/series comparison result: ${JSON.stringify(compareTo490Result)}`);
  return compareTo490Result ? compareTo490Result : undefined;

  function combine490Titles(combinedFeatures, seriesFeatures) {
    const combResult = seriesFeatures.map(seriesFeature => combineSeriesFeature(combinedFeatures, seriesFeature));
    return combResult.flat();
  }

  function combineSeriesFeature(combinedFeatures, seriesFeature) {
    //{"seriesTitle": "Vauva tunnustelee","seriesNumber": "undefined"}}
    // 245 + 490a + 490v
    // 245 + 490a
    // 490a + 245
    // 490a + 490v + 245
    const combArray = [
      `${combinedFeatures} ${seriesFeature.seriesTitle}`,
      `${combinedFeatures} ${seriesFeature.seriesTitle}${seriesFeature.seriesNumber === 'undefined' ? '' : ' '.concat(seriesFeature.seriesNumber)}`,
      `${seriesFeature.seriesTitle} ${combinedFeatures}`,
      `${seriesFeature.seriesTitle}${seriesFeature.seriesNumber === 'undefined' ? '' : ' '.concat(seriesFeature.seriesNumber)} ${combinedFeatures}`
    ];
    //debug(combArray);
    return [...new Set(combArray)];
  }
}

function checkTitleComparisonResult(result) {
  debugDev(`checkTitleComparisonResult: ${JSON.stringify(result)}`);

  // If we had undefined as titleFeatures, one of records is missing a title, we do not want to match these
  if (result.undefinedTitleFeatures !== undefined && result.undefinedTitleFeatures !== true) {
    return result.undefinedTitleFeatures;
  }

  // If all titleFeatures match, we don't even compare others
  if (result.combinedFeatures === true) {
    return true;
  }

  // Note: title, combinedFeatures or combinedTitle can be "A" or "B" if title of one record is subset of title in another
  if (result.title === false || result.numberOfPartInSectionOfAWork === false || result.nameOfPartInSectionOfAWork === false) {
    // Matches from 245 vs 946 or 245 vs 490 are OK
    if (result.series === true || result.f946 === true) {
      return true;
    }
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

function cleanValue(value) {
  return removeExtraSpaces(stripPunc(value));
}
