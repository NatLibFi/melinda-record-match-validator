/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2020-2022 University Of Helsinki (The National Library Of Finland)
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
*/

// Handle fields 336, 337 and 338.

import createDebugLogger from 'debug';
import {fieldHasValidNonRepeatableSubfield, isComponentPart, nvdebug, subfieldSetsAreEqual} from './utils';
import {hasFields, getSubfield} from './collectFunctions/collectUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field33X');

function isValid33X(field) {
  if (!['336', '337', '338'].includes(field.tag)) {
    return false;
  }
  if (!['a', 'b', '2'].every(subfieldCode => fieldHasValidNonRepeatableSubfield(field, subfieldCode))) {
    return false;
  }
  // We might have some control subfield checks here?!?
  return true;
}

function check33X(record1, record2, tag) {
  // Returns just true (=match) or false (=mismatch).
  // Compare $b subfields only (language-specific $a contains same info but). How about $3 and $6?
  // (During merge we might prefer language X $a fields but that does not concern us here.)
  const fields1 = record1.get(tag);
  const fields2 = record2.get(tag);

  if (fields1.length !== fields2.length) {
    nvdebug(`check33X: ${tag}: FAIL: size mismatch`, debug);
    return false;
  }
  if (fields1.length === 0) {
    if (tag !== '338') { // 336 and 337 must always be present
      nvdebug(`check33X: Comparison result: ${tag} is empty`, debug);
      return false;
    }
    // 338 is optional only for comps
    if (!isComponentPart(record1)) {
      return false;
    }
    return true;
  }
  // Remove crappy fields:
  const validFields1 = fields1.filter(field => isValid33X(field));
  const validFields2 = fields2.filter(field => isValid33X(field));
  if (validFields1.length !== fields1.length) { // Data was lost: abort
    return false;
  }
  // Compare 33X$b contents:
  return subfieldSetsAreEqual(validFields1, validFields2, 'b');
}

export function check336(record1, record2) {
  return check33X(record1, record2, '336');
}

export function check337(record1, record2) {
  return check33X(record1, record2, '337');
}

export function check338(record1, record2) {
  return check33X(record1, record2, '338');
}


/*
336, 337, 338 $b:t
  automaatiolla pitää miettiä jotain parempaa logiikkaa - mut tekstiaineistoissa jos toinen tietue on 337 $b c ja toinen on 337 $b n niin yhdistämistä ei saa tehdä.
  (Tietokonekäyttöinen teksti ja fyysinen teksti)
*/

export function get336bContentType(record) {
  const contentTypes = hasFields('336', record, getSubfield, 'b');
  debug('Field 336 content types: %o', contentTypes);

  return {contentTypes};
}

export function get337bMediaType(record) {
  const mediaTypes = hasFields('337', record, getSubfield, 'b');
  debug('Field 337 media types: %o', mediaTypes);

  return {mediaTypes};
}

export function get338bCarrierType(record) {
  const carrierTypes = hasFields('338', record, getSubfield, 'b');
  debug('Field 338 carrier types: %o', carrierTypes);

  return {carrierTypes};
}

