import createDebugLogger from 'debug';
// DEVELOP: import just needed feature, import from module instead of file
import * as features from '@natlibfi/melinda-record-matching/src/match-detection/features/bib/index.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:identifier-warnings');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

// Warn user if records have mismatching identifier types or mismatching identifiers
// Use matcher matchDetection feature bib/language for comparing
const {extract, compare, name}  = features['isbn']();
debug(`Using matcher feature: ${name}`);

// Get set of ISBN features from a record
export function getISBNFeatures(record, recordExternal = {}) {
    return {ISBN: extract({record, recordExternal})}
}

// Compare two sets of language features
export function compareISBNFeatures({ISBNFeatures1, ISBNFeatures2}) {
    debugDev(JSON.stringify(ISBNFeatures1));
    debugDev(JSON.stringify(ISBNFeatures2));
    const compareResult = compare(ISBNFeatures1.ISBN, ISBNFeatures2.ISBN)
    debug(`CompareResult: ${compareResult}`);
    // convert point result to boolean
    return convertPointsToBoolean(compareResult);
}

// Check two records by their language features
export function checkISBN({record1, record2}) {
    debugDev(`Running checkISBN`);
    const ISBNFeatures1 = getISBNFeatures(record1);
    const ISBNFeatures2 = getISBNFeatures(record2);

    return compareISBNFeatures({ISBNFeatures1, ISBNFeatures2});
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