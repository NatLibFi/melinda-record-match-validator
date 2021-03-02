/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2020 University Of Helsinki (The National Library Of Finland)
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

export function getRecordInfo(record) {
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:leader');

  const {leader} = record;
  const [, , , , , , recordTypeRaw, recordBibLevelRaw, , , , , , , , , , recordCompletionLevel] = leader;

  debug('Record type raw: %o', recordTypeRaw);
  debug('Record bib level raw: %o', recordBibLevelRaw);
  debug('Record completion level raw: %o', recordCompletionLevel);

  return {
    recordType: getRecordType(),
    recordBibLevel: getRecordBibLevel(),
    recordCompletionLevel: getRecordCompletionLevel()
  };

  function getRecordType() {
    if (recordTypeRaw === 'a') {
      return {level: 'Language material', code: 'a'};
    }

    if (recordTypeRaw === 'c') {
      return {level: 'Notated music', code: 'c'};
    }

    if (recordTypeRaw === 'd') {
      return {level: 'Manuscript notated music', code: 'd'};
    }

    if (recordTypeRaw === 'e') {
      return {level: 'Cartographic material', code: 'e'};
    }

    if (recordTypeRaw === 'f') {
      return {level: 'Manuscript cartographic material', code: 'f'};
    }

    if (recordTypeRaw === 'g') {
      return {level: 'Projected medium', code: 'g'};
    }

    if (recordTypeRaw === 'i') {
      return {level: 'Nonmusical sound recording', code: 'i'};
    }

    if (recordTypeRaw === 'j') {
      return {level: 'Musical sound recording', code: 'j'};
    }

    if (recordTypeRaw === 'k') {
      return {level: 'Two-dimensional nonprojectable graphic', code: 'k'};
    }

    if (recordTypeRaw === 'm') {
      return {level: 'Computer file', code: 'm'};
    }

    if (recordTypeRaw === 'o') {
      return {level: 'Kit', code: 'o'};
    }

    if (recordTypeRaw === 'p') {
      return {level: 'Mixed materials', code: 'p'};
    }

    if (recordTypeRaw === 'r') {
      return {level: 'Three-dimensional artifact or naturally occurring object', code: 'r'};
    }

    if (recordTypeRaw === 't') {
      return {level: 'Manuscript language material', code: 't'};
    }

    throw new Error('Invalid record type');
  }

  function getRecordBibLevel() {
    // onko tietueessa 773-kenttää. tässä siis isComponent: bibLevel: a, b, d ja/tai on 773-kenttä/kenttiä
    if (recordBibLevelRaw === 'a') {
      return {level: 'Monographic component part', code: 'a'};
    }

    if (recordBibLevelRaw === 'b') {
      return {level: 'Serial component part', code: 'b'};
    }

    if (recordBibLevelRaw === 'c') {
      return {level: 'Collection', code: 'c'};
    }

    if (recordBibLevelRaw === 'd') {
      return {level: 'Subunit', code: 'd'};
    }

    if (recordBibLevelRaw === 'i') {
      return {level: 'Integrating resource', code: 'i'};
    }

    if (recordBibLevelRaw === 'm') {
      return {level: 'Monograph/Item', code: 'm'};
    }

    if (recordBibLevelRaw === 's') {
      return {level: 'Serial', code: 's'};
    }

    throw new Error('Invalid record bib level');
  }

  function getRecordCompletionLevel() {
    if (recordCompletionLevel === ' ') {
      return {level: 'Full level', code: ' '};
    }

    if (recordCompletionLevel === '1') {
      return {level: 'Full level, material not examined', code: '1'};
    }

    if (recordCompletionLevel === '2') {
      return {level: 'Less-than-full level, material not examined', code: '2'};
    }

    if (recordCompletionLevel === '3') {
      return {level: 'Abbreviated level', code: '3'};
    }

    if (recordCompletionLevel === '4') {
      return {level: 'Core level', code: '4'};
    }

    if (recordCompletionLevel === '5') {
      return {level: 'Partial (preliminary) level', code: '5'};
    }

    if (recordCompletionLevel === '7') {
      return {level: 'Minimal level', code: '7'};
    }

    if (recordCompletionLevel === '8') {
      return {level: 'Prepublication level', code: '8'};
    }

    if (recordCompletionLevel === 'u') {
      return {level: 'Unknown', code: 'u'};
    }

    if (recordCompletionLevel === 'z') {
      return {level: 'Not applicable', code: 'z'};
    }

    throw new Error('Invalid record completion level');
  }
}
