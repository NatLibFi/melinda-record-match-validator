import createDebugLogger from 'debug';
// DEVELOP: import just needed feature, import from module instead of file
import * as features from '@natlibfi/melinda-record-matching/src/match-detection/features/bib/index.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:language');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

// Warn user if records have mismatching language information
// Use matcher matchDetection feature bib/language for comparing
const {extract, compare, name}  = features['language']();
debug(`Using matcher feature: ${name}`);

// Get set of language features from a record
export function getLanguageFeatures(record, recordExternal = {}) {
    return {language: extract({record, recordExternal})}
}

// Compare two sets of language features
export function compareLanguageFeatures({languageFeatures1, languageFeatures2}) {
    debugDev(JSON.stringify(languageFeatures1));
    debugDev(JSON.stringify(languageFeatures2));
    const compareResult = compare(languageFeatures1.language, languageFeatures2.language)
    debug(`CompareResult: ${compareResult}`);
    // convert point result to boolean
    return convertPointsToBoolean(compareResult);
}

// Check two records by their language features
export function checkLanguage({record1, record2}) {
    const languageFeatures1 = getLanguageFeatures(record1);
    const languageFeatures2 = getLanguageFeatures(record2);

    return compareLanguageFeatures({languageFeatures1, languageFeatures2});
}

// Return false for points that are less than threshold
// default threshold is 0
// DEVELOP: move this to utils if we use more matchDetection features here
function convertPointsToBoolean(points, threshold = 0) {
    if (points < threshold) {
        debugDev(`Returning false for less points (${points}) than threshold ${threshold}`);
        return false;
    }
    debugDev(`Returning true for equal or more points (${points}) than threshold ${threshold}`);
    return true;
}