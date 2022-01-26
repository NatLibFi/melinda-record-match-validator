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
import {getSubfieldValues} from './collectFunctions/collectUtils';

export function check040b(record1, record2) {
  const score1 = recordScore040FieldLanguage(record1);
  const score2 = recordScore040FieldLanguage(record2);
  //nvdebug(`040$b scores: ${score1} vs ${score2}`);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }
  return true; // This test does not fail

  function recordScore040FieldLanguage(record) {
    const fields = record.get('040');
    if (fields.length !== 1) {
      return 0;
    }
    return score040SubfieldBValues(getSubfieldValues(fields[0], 'b'));
  }

  function score040SubfieldBValues(values) {
    if (values.length !== 1) {
      return 0;
    }
    if (values[0] === 'fin') {
      return 4;
    }
    // Sorry my Finlandswedish colleagues: I've 'fin' preference over 'swe' due to number of users.
    if (values[0] === 'swe') {
      return 3;
    } // Copy-cataloguing record, that has not yet been fully nativized to 'fin' or 'swe'
    if (values[0] === 'mul') {
      return 2;
    }
    // Typically a copy-catalogued record, that has not been properly changed to 'mul'.
    // However, NL has done english-records for Nordenskiöld collection, so we'll prefer 'eng' over other languages.
    if (values[0] === 'eng') {
      return 1;
    }
    // Now now. Should we assume that no 040$b is better than, say, 040$b foo? Currently we don't think so.
    return 0;
  }
}

export function check040e(record1, record2) {
  const score1 = recordScore040FieldDescriptionConvention(record1);
  const score2 = recordScore040FieldDescriptionConvention(record2);
  //nvdebug(`040$e scores: ${score1} vs ${score2}`);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }

  function recordScore040FieldDescriptionConvention(record) {
    const fields = record.get('040');
    if (fields.length !== 1) {
      return 0;
    }
    return score040SubfieldEValues(getSubfieldValues(fields[0], 'e'));
  }

  function score040SubfieldEValues(values) {

    /* // If multiple $e's a problem? Once I thought so, but not anymore. However, keep this comment here for discussion.
    if (values.length !== 1) {
      return 0;
    }
    */
    if (values.includes('rda')) {
      return 1;
    }
    // Now now... Should we assume that no 040$e is better than, say, 040$e FFS?
    // We take no sides, return same score for both, and hope that some other rule makes a good decision for us.
    return 0;
  }

  return true; // This test does not fail
}
