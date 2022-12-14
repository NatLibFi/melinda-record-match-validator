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

function hasIsbn(record) {
  const fields = record.get('020');
  return fields.length > 0;
}

function check028(record) {
  // As per https://www.kiwi.fi/display/kumea/2021-06-16#id-20210616-1d)Celianjulkaisutunnus
  const fields = record.get('028');
  return fields.some(field => field.subfields.some(subfield => subfield.code === 'b' && subfield.value === 'Celia'));
}

function check245(record) {
  const fields = record.get('245');
  return fields.some(field => field.subfields.some(subfield => subfield.code === 'b' && subfield.value.match(/^Daisy-äänikirja vain lukemisesteisille/u)));
}

function check26X(record) {
  const fields = record.get('26[04]');
  return fields.some(field => field.subfields.some(subfield => subfield.code === 'b' && subfield.value.match(/^\[?Celia/ui)));
}

function check300(record) {
  const fields = record.get('300');
  return fields.some(field => field.subfields.some(subfield => isDaisySubfield300A(subfield)));

  function isDaisySubfield300A(subfield) {
    if (subfield.code !== 'a') {
      return false;
    }
    return subfield.value.includes('levy (Daisy)') || subfield.value.includes('levyä (Daisy)');
  }
}

function check347(record) {
  const fields = record.get('347');
  return fields.some(field => isDaisyField347(field));

  function isDaisyField347(field) {
    if (!field.subfields.some(subfield => subfield.code === 'a' && subfield.value === 'äänitiedosto')) {
      return false;
    }
    return field.subfields.some(subfield => subfield.code === 'b' && subfield.value === 'Daisy');
  }

}

function check516(record) {
  const fields = record.get('516');
  return fields.some(field => field.subfields.some(subfield => subfield.code === 'a' && subfield.value.match(/^Daisy-äänitiedosto\.?$/ui)));
}

function check538(record) {
  const fields = record.get('538');
  // Just /Daisy/i will do, as values are a bit complex
  return fields.some(field => field.subfields.some(subfield => subfield.code === 'a' && subfield.value.match(/Daisy/ui)));
}


//    if (subfield.value.match(/LP-(?:äänilevy|ljudskiv)/ui)) {


function isDaisy(record) {
  if (hasIsbn(record)) {
    return false;
  }
  // Should we check audioness etc?
  if (check028(record)) {
    return true;
  }
  if (check245(record)) {
    return true;
  }
  if (check26X(record)) {
    return true;
  }
  if (check300(record)) {
    return true;
  }
  if (check347(record)) {
    return true;
  }
  if (check516(record)) {
    return true;
  }
  if (check538(record)) {
    return true;
  }

  return false;
}


export function performDaisySanityCheck({record1, record2}) {
  const daisiness1 = isDaisy(record1);
  const daisiness2 = isDaisy(record2);

  return daisiness1 === daisiness2;
}
