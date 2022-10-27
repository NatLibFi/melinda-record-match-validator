/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2022 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-record-match-validator
*
* melinda-record-match-validator program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-record-match-validator is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*
*/

import {get245} from './field245';
import {getExtentsForPartsAndSets} from './partsAndSetsExtent';

import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:partsAndSets:test');
const debugData = debug.extend('data');

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
  const title = get245(record);
  const type = getTitleType(title);

  return {...title, type};
}

export function getTitleType(title) {
  // If there is subfield $p or $n in the title field, we can assume that the record describes a part
  const type = title.nameOfPartInSectionOfAWork !== 'undefined' || title.numberOfPartInSectionOfAWork !== 'undefined' ? 'part' : 'unknown';

  // we could also make guesses about numbers / roman numerals in the actual title subfields $a and $b

  return type;
}


// Compare two records by their partSetFeatures
export function compareRecordsPartSetFeatures({record1, record2}) {

  const partSetFeatures1 = getPartSetFeatures(record1);
  const partSetFeatures2 = getPartSetFeatures(record2);

  return checkPartSetFeatures({partSetFeatures1, partSetFeatures2});
}

// Check two sets of partSetFeatures
export function checkPartSetFeatures({partSetFeatures1, partSetFeatures2}) {

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

