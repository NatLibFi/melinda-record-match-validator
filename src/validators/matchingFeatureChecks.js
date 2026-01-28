import createDebugLogger from 'debug';
import * as features from '@natlibfi/melinda-record-matching/src/match-detection/features/bib/index.js';

// Validate match by using a matchDetection feature from melinda-record-matching
// Defaults to failing match if matchDetection comparison of feature returns less than 0 points (threshold = 0)

// current (v5.0.1) matchDetection features available in melinda-record-matching:
//
// hostComponent, isbn, issn, otherStandardIdentifier, title, titleVersionOriginal, authors, recordType,
// publicationTime, publicationTimeAllowConsYears, publicationTimeAllowConsYearsMulti, language, bibliographicLevel,
// melindaId, allSourceIds, mediaType

// Note: if feature does not return below zero points, it's not useful in match validator

export function getCheckFeature({featureName, threshold = 0}) {
    const debug = createDebugLogger(`@natlibfi/melinda-record-match-validator:matching-feature-checks:${featureName}`);
    const debugDev = debug.extend('dev');
    //const debugData = debug.extend('data');

    debug(`Using matcher feature (bib): ${featureName}`);

    return checkFeature;


    // Get features from a record
    function getFeatures(featureName, record, recordExternal = {}) {
        const {extract} = features[featureName]();
        return {[featureName]: extract({record, recordExternal})}
    }

    // Compare features
    function compareFeatures({features1, features2}) {
        debugDev(JSON.stringify(features1));
        debugDev(JSON.stringify(features2));
        const {compare} = features[featureName]();
        const compareResult = compare(features1[featureName], features2[featureName])
        debug(`CompareResult: ${compareResult}`);
        // convert point result to boolean
        return convertPointsToBoolean(compareResult, threshold);
    }

    // Check two records by features
    function checkFeature({record1, record2}) {
        debugDev(`=== Running checkFeature for ${featureName} ===`);
        const features1 = getFeatures(featureName, record1);
        const features2 = getFeatures(featureName, record2);
        return compareFeatures({features1, features2});
    }


    // Return false for points that are less than threshold
    // default threshold is 0
    function convertPointsToBoolean(points, threshold) {
        if (points < threshold) {
            debugDev(`Returning false for less points (${points}) than threshold ${threshold}`);
            return false;
        }
        debugDev(`Returning true for equal or more points (${points}) than threshold ${threshold}`);
        return true;
    }
}

// Check All Features - under development, not currently usable
export function checkAllFeatures({record1, record2}) { 
    const debug = createDebugLogger(`@natlibfi/melinda-record-match-validator:matching-feature-checks:all-features`);
    const debugDev = debug.extend('dev');
    debugDev(`=== Running allFeatures check ==== `);
    let result = [];

    Object.keys(features).forEach(feature => {
        const {name} = features[feature]();
        debugDev(`---- ${feature} : ${name} -----`);
        const checkFeature = getCheckFeature({featureName: feature});
        result.push({feature: checkFeature({record1, record2})});
    });
    debugDev(JSON.stringify(result));
    const filteredResult = result.filter(feature => feature === false);
    debugDev(JSON.stringify(filteredResult));
    return filteredResult.length > 0 ? filteredResult : false;
}
