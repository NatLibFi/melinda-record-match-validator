
import {get245} from './field245';
import {getExtentsForPartsAndSets} from './partsAndSetsExtent';

import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:partsAndSets');
const debugData = debug.extend('data');

// This validator checks (or tries to check) that a record that describes a part of a set and a record
// that describes the whole set won't be considered a valid match

// We could also have functionalities for checking that records describing different parts of a set would
// not be consisered a valid match

// Use cases:
//   * multi-part monographs described as parts or as whole sets
//   * possible also different sets of mixed materials


// Extract partSetFeatures from a record
export function getPartSetFeatures(record) {

  // Get parts and sets features from f300 : extent
  const extentsForPartsAndSets = getExtentsForPartsAndSets(record);
  debugData(extentsForPartsAndSets);
  // Get parts and sets feature from f245 subfields for parts
  const titleForPartsAndSets = getTitleForPartsAndSets(record);
  debugData(titleForPartsAndSets);

  // We should also get parts and sets features from:

  // * StandardIdentifiers and their qualifiers
  //    * if record has two ISBNs with qualifiers 'Part 1' and 'Part 2' it's a record for a set
  //    * if record has only one ISBN with qualifier 'set' it's a record for a set
  //    * if record has two ISBNs with qualifiers 'Part 2' and 'set' it's a record for a part

  // * StandardIdentifier amounts
  //     * if record has several ISBNs it might be a set (discard cases where ISBNs are ISBN10 and ISBN13)

  // * Notefields 500/515
  //    * if record has field 500/515 with note 'ISBN for complete set', it's probably a record for a part - 020 has ISBN for the part

  // Different fields with $3
  //    * if record has fields that have subfields $3 like 'Part 1', 'Part 2' it's probably a record for a set

  const allTypes = [titleForPartsAndSets.type, ...extentsForPartsAndSets.map(extent => extent.type)];
  debugData(allTypes);

  function getTypeFromAllTypes(allTypes) {

    // If we have set-type features and no part-type features we can assume the record is of type 'set'
    if (allTypes.some((type) => type === 'set') && !allTypes.some((type) => type === 'part')) {
      return 'set';
    }

    // If we have part-type features and no part-type features we can assume the record is of type 'part'
    if (allTypes.some((type) => type === 'part') && !allTypes.some((type) => type === 'set')) {
      return 'part';
    }

    // If we have a set-type feature can assume the record is of type 'set'
    if (allTypes.some((type) => type === 'set')) {
      return 'set';
    }


    // If we have both part-type features and set-type features, or no part-set-features assume we don't know the type
    return 'unknown';
  }

  return {
    type: getTypeFromAllTypes(allTypes),
    details: {
      extentsForPartsAndSets,
      titleForPartsAndSets
    }
  };
}

export function getTitleForPartsAndSets(record) {
  // Both $n (number of part) and $p (name of part) are repeatable subfields - do we get all of the instances?
  const title = get245(record);
  const type = getTitleType(title);

  return {...title, type};
}

export function getTitleType(title) {
  debugData(title);

  const {nameOfPartInSectionOfAWork, numberOfPartInSectionOfAWork} = title;

  if (nameOfPartInSectionOfAWork === 'undefined' && numberOfPartInSectionOfAWork === 'undefined') {
    return 'unknown';
  }

  // If we have subfield $n and its has not `1-2` type of content we can assume part
  // Note: we can have a case where we have a set of subparts that contain a part ...
  if (numberOfPartInSectionOfAWork && numberOfPartInSectionOfAWork !== 'undefined') {
    debug(`We have number: ${numberOfPartInSectionOfAWork}`);
    if (numberOfPartInSectionOfAWork.match(/\d+-\d+/u)) {
      debug(`But number is of several parts: ${numberOfPartInSectionOfAWork}`);
      return 'unknown';
    }
    return 'part';
  }

  // If we have a subgield $p we can assume part
  if (nameOfPartInSectionOfAWork && nameOfPartInSectionOfAWork !== 'undefined') {
    debug(`We have name: ${nameOfPartInSectionOfAWork}`);
    return 'part';
  }

  // we could also make guesses about numbers / roman numerals in the actual title subfields $a and $b

  return 'unknown';
}


// Compare two records by their partSetFeatures
export function compareRecordsPartSetFeatures({record1, record2}) {

  const partSetFeatures1 = getPartSetFeatures(record1);
  const partSetFeatures2 = getPartSetFeatures(record2);

  return checkPartSetFeatures({partSetFeatures1, partSetFeatures2});
}

// Check two sets of partSetFeatures
export function checkPartSetFeatures({partSetFeatures1, partSetFeatures2}) {
  debugData(JSON.stringify(partSetFeatures1));
  debugData(JSON.stringify(partSetFeatures2));
  if (partSetFeatures1.type === partSetFeatures2.type) {
    return true;
  }

  if (partSetFeatures1.type === 'unknown' || partSetFeatures2.type === 'unknown') {
    return true;
  }

  if (partSetFeatures1.type !== partSetFeatures2.type) {
    return false;
  }

  // Fallback, but we should not end up here
  return false;
}

