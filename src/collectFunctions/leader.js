/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2020-2021 University Of Helsinki (The National Library Of Finland)
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

import createDebugLogger from 'debug';

// Descriptions of type of record, bibliographical level and encoding level are from  https://www.loc.gov/marc/bibliographic/bdleader.html

const typeOfRecordHash = {
  'a' : 'Language material',
  'c' : 'Notated music',
  'd' : 'Manuscript notated music',
  'e' : 'Cartographic material',
  'f' : 'Manuscript cartographic material',
  'g' : 'Projected medium',
  'i' : 'Nonmusical sound recording',
  'j' : 'Musical sound recording',
  'k' : 'Two-dimensional nonprojectable graphic',
  'm' : 'Computer file',
  'o' : 'Kit',
  'p' : 'Mixed materials',
  'r' : 'Three-dimensional artifact or naturally occurring object',
  't' : 'Manuscript language material'
};

const bibliographicalLevelHash = {
  'a' : 'Monographic component part',
  'b' : 'Serial component part',
  'c' : 'Collection',
  'd' : 'Subunit',
  'i' : 'Integrating resource',
  'm' : 'Monograph/Item',
  's' : 'Serial'
};

const encodingLevelHash = {
  ' ' : 'Full level',
  '1' : 'Full level, material not examined',
  '2' : 'Less-than-full level, material not examined',
  '3' : 'Abbreviated level',
  '4' : 'Core level',
  '5' : 'Partial (preliminary) level',
  '7' : 'Minimal level',
  '8' : 'Prepublication level',
  'u' : 'Unknown',
  'z' : 'Not applicable' 
};

export function mapTypeOfRecord(typeOfRecord) {
  if ( typeOfRecord in typeOfRecordHash ) {
    return {level: typeOfRecordHash[typeOfRecord], code: typeOfRecord}
  }
  throw new Error(`Invalid record type ${typeOfRecord}`);
}

export function mapBibliographicalLevel(bibliographicalLevel) {
  if ( bibliographicalLevel in bibliographicalLevelHash ) {
    return {level: bibliographicalLevelHash[bibliographicalLevel], code: bibliographicalLevel};
  }

  throw new Error('Invalid record bib level');
}

export function EncodingLevel(encodingLevel) {
  if ( encodingLevel in encodingLevelHash) {
    return {level: encodingLevelHash[encodingLevel], code: encodingLevel};
  }
  throw new Error('Invalid record completion level');
}

export function getRecordInfo(record) {
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:leader');

  const recordTypeRaw = record.leader[6];
  const recordBibLevelRaw = record.leader[7];
  const recordCompletionLevel = record.leader[17];

  debug('Record type raw: %o', recordTypeRaw);
  debug('Record bib level raw: %o', recordBibLevelRaw);
  debug('Record completion level raw: %o', recordCompletionLevel);

  return {
    recordType: mapTypeOfRecord(recordTypeRaw),
    recordBibLevel: mapBibliographicalLevel(recordBibLevelRaw),
    recordCompletionLevel: mapEncodingLevel(recordCompletionLevel)
  };
}
