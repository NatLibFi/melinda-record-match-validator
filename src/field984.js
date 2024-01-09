/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Melinda record match validator modules for Javascript
*
* Copyright (C) 2024 University Of Helsinki (The National Library Of Finland)
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

// Implements MRA-744
export function check984({record1, record2}) {
  const score1 = score984(record1);
  const score2 = score984(record2);
  // Should we use more generic score1 > score2? Does not having a 260/264 field imply badness?
  // Currently
  if (score1 > score2) {
    return 'A';
  }
  if (score2 > score1) {
    return 'B';
  }
  return true;

  function score984(currRecord) {
    const fields984 = currRecord.fields.filter(f => f.tag === '984');

    if (fields984.some(f => isPreferred(f))) {
      return 1;
    }
    if (fields984.some(f => isSnubbed(f))) {
      return -1;
    }
    return 0;
  }

  function isPreferred(field) {
    if (field.tag !== '984') {
      return false;
    }
    return field.subfields.some(sf => sf.code === 'a' && sf.value === 'ALWAYS-PREFER-IN-MERGE');
  }

  function isSnubbed(field) {
    if (field.tag !== '984') {
      return false;
    }
    return field.subfields.some(sf => sf.code === 'a' && sf.value === 'NEVER-PREFER-IN-MERGE');
  }
}
