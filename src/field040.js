import {getSubfieldValue, getSubfieldValues, hasField} from './collectFunctions/collectUtils.js';

//// Scores for various values in 040$b Language Cataloging
// Sorry, my Finlandswedish colleagues and friends: I've given Finnis top priority.
// 'fin', 'swe', and 'mul' so 'mul' comes third. It's typically seen in copycatalogued records,
// that have not (yet) been fully translated. These werethe original three.
// However, NL has done English-only records for Nordenskiöld collection, so we'll prefer 'eng' over other languages.
const scoreFor040b = {'fin': 4, 'swe': 3, 'mul': 2, 'eng': 1};

export function check040b({record1, record2}) {
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
    const b = hasField('040', record, getSubfieldValue, 'b');
    if (b === null || !(b in scoreFor040b)) {
      return 0;
    }
    return scoreFor040b[b];
  }
}

export function check040e({record1, record2}) {
  const score1 = recordScore040FieldDescriptionConvention(record1);
  const score2 = recordScore040FieldDescriptionConvention(record2);
  //nvdebug(`040$e scores: ${score1} vs ${score2}`);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }
  return true; // This test does not fail

  function recordScore040FieldDescriptionConvention(record) {
    const e = hasField('040', record, getSubfieldValues, 'e');
    if (e.length !== 1) {
      return 0;
    }
    // Is multiple $e's a problem? Once I thought so, but not anymore. However, keep this comment here for discussion.
    if (e.includes('rda')) {
      return 1;
    }
    // Now now... Should we assume that no 040$e is better than, say, 040$e FFS?
    // Currently we take no sides, return same score for both, and hope that some other rule makes a good decision for us.
    return 0;
  }
}
