
import createDebugLogger from 'debug';
//import {nvdebug} from '../utils.js';
import {hasFields, getSubfield, stripPunc} from './collectFunctions/collectUtils.js';
import {compareValueContent} from './compareFunctions/compareUtils.js';
//import {fieldGetNonRepeatableValue, fieldToString, nvdebug, subfieldSetsAreEqual} from './utils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field245');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

// Note: title.js replaces this

// 245 n & p
// tosin nää ei varmaan kuitenkaan tuu onixista, eli KV:n ennakkotietotapauksessa toi blokkais kaikki, joissa Melindassa olis tehty noi valmiiksi nimekkeeseen
// niissä tapauksissa, joissa tuodaan alunperin marc21-kirjastodataa tai yhdistetään Melindan tietueita, tää on oleellisehko
export function get245(record) {
  const [f245] = hasFields('245', record, f245ToJSON);
  debugDev('Field 245 info: %o', f245);

  return f245;

  function f245ToJSON(field) {
    const title = stripPunc(getSubfield(field, 'a'));
    const remainderOfTitle = stripPunc(getSubfield(field, 'b')); // Do we want
    // Note: both $p and $n are repeatable, we get only first instances of them here?
    const numberOfPartInSectionOfAWork = stripPunc(getSubfield(field, 'n'));
    const nameOfPartInSectionOfAWork = stripPunc(getSubfield(field, 'p'));

    return {title, remainderOfTitle, numberOfPartInSectionOfAWork, nameOfPartInSectionOfAWork};
  }
}

function compare245data(f245A, f245B) {
  // NOTE: we do nothing with f245 $b remainderOfTitle here!
  return {
    'nameOfPartInSectionOfAWork': compareValueContent(f245A.nameOfPartInSectionOfAWork, f245B.nameOfPartInSectionOfAWork, '245 name: '),
    'numberOfPartInSectionOfAWork': compareValueContent(f245A.numberOfPartInSectionOfAWork, f245B.numberOfPartInSectionOfAWork, '245 number: '),
    'title': compareValueContent(f245A.title, f245B.title, '245 title: ')
  };
}

// 245 n & p
// tosin nää ei varmaan kuitenkaan tuu onixista, eli KV:n ennakkotietotapauksessa toi blokkais kaikki, joissa Melindassa olis tehty noi valmiiksi nimekkeeseen
// niissä tapauksissa, joissa tuodaan alunperin marc21-kirjastodataa tai yhdistetään Melindan tietueita, tää on oleellisehko
export function compare245(recordValuesA, recordValuesB) {
  const f245A = recordValuesA['245'];
  const f245B = recordValuesB['245'];
  debugDev('%o vs %o', f245A, f245B);
  return compare245data(f245A, f245B);
}

export function check245({record1, record2}) {
  const data1 = get245(record1);
  const data2 = get245(record2);

  const result = compare245data(data1, data2);
  if (result.title === false || result.numberOfPartInSectionOfAWork === false || result.nameOfPartInSectionOfAWork === false) {
    return false;
  }
  // Room for 'A' and 'B'?
  return true;


  // Get both 245 fields and remove punctuation for easier comparisons:
/*
  const fields1 = record1.get('245');
  const fields2 = record2.get('245');
  if (fields1.length !== 1 || fields2.length !== 1) {
    return false;
  }

  // NB! punctuation removal code has not been perfectly tested yet, and it does not cover all fields yet.
  // So test and fix and test and fix...

  const clone1 = cloneAndNormalizeField(fields1[0]);
  const clone2 = cloneAndNormalizeField(fields2[0]);
  //return true;
  nvdebug(fieldToString(clone1));
  nvdebug(fieldToString(clone2));
  if (!check245a(clone1, clone2) || !check245b(clone1, clone2) ||
    !subfieldSetsAreEqual([clone1], [clone2], 'n') || !subfieldSetsAreEqual([clone1], [clone2], 'p')) {
    return false;
  }
  // NB! How about: /c?/ and /n+/ ? Should we handle them?

  return true;

  function check245a(field1, field2) {
    const a1 = fieldGetNonRepeatableValue(field1, 'a');
    const a2 = fieldGetNonRepeatableValue(field2, 'a');
    if (a1 === null || a2 === null || a1 !== a2) {
      return false;
    }
    return true;
  }

  function check245b(field1, field2) {
    const b1 = fieldGetNonRepeatableValue(field1, 'b');
    const b2 = fieldGetNonRepeatableValue(field2, 'b');
    if (b1 === null || b2 === null) {
      return true; // subtitle is considered optional, and it's omission won't prevent proceeding
    }
    return b1 === b2;
  }
*/
}
