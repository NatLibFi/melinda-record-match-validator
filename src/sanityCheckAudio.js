/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2021-2022 University Of Helsinki (The National Library Of Finland)
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

//import createDebugLogger from 'debug';
//import {nvdebug} from './utils';

//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:physicalDescription');

function physicalDescriptionContainsCdAanilevy(fields300) {
  return fields300.some(field => field.subfields.some(subfield => containsCdAanilevy(subfield)));

  function containsCdAanilevy(subfield) {
    if (subfield.code !== 'a') {
      return false;
    }
    if (subfield.value?.match(/CD-(?:äänilevy|ljudskiv)/ui)) {
      return true;
    }
    return false;
  }
}

function physicalDescriptionContainsLpAanilevy(fields300) {
  return fields300.some(field => field.subfields.some(subfield => containsLpAanilevy(subfield)));

  function containsLpAanilevy(subfield) {
    if (subfield.code !== 'a') {
      return false;
    }
    if (subfield.value?.match(/LP-(?:äänilevy|ljudskiv)/ui)) {
      return true;
    }
    return false;
  }
}

function isCdAanilevy(record) {
  const fields007 = record.get(/^007$/u);
  if (fields007.some(field => field.value.match(/^sd.f..g...m/u))) {
    return true;
  }

  const fields = record.get(/^300$/u);
  if (physicalDescriptionContainsCdAanilevy(fields)) {
    return true;
  }

  return false;
}

function isLpAanilevy(record) {
  const fields007 = record.get(/^007$/u);
  if (fields007.some(field => field.value.match(/^sd.[cd]..e...p/u))) {
    return true;
  }

  const fields300 = record.get(/^300$/u);
  if (physicalDescriptionContainsLpAanilevy(fields300)) {
    return true;
  }

  return false;
}

function getPhysicalDescription(record) {
  //const fields = record.get(/^300$/u);

  const result = {
    containsCdAanilevy: isCdAanilevy(record),
    containsLpAanilevy: isLpAanilevy(record)
  };

  return result;
}

export function performAudioSanityCheck({record1, record2}) {
  const results1 = getPhysicalDescription(record1);
  const results2 = getPhysicalDescription(record2);

  // NB! This won't fail if one 300$a has CD-äänilevy and the other one does not.
  // This only fails if one is CD and the other is LP.
  // $a 1 LP-ä
  const checkLp = results1.containsCdAanilevy || results2.containsCdAanilevy;
  const checkCd = results1.containsLpAanilevy || results2.containsLpAanilevy;

  if (checkCd && results1.containsCdAanilevy !== results2.containsCdAanilevy) {
    return false;
  }

  if (checkLp && results1.containsLpAanilevy !== results2.containsLpAanilevy) {
    return false;
  }

  return true;
}
