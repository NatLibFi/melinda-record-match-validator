import assert from 'node:assert';
import {test} from 'node:test';
import {MarcRecord} from '@natlibfi/marc-record';

import {
  hasField,
  hasFields,
  getSubfieldValue,
  getSubfieldValues,
  stripPunc,
  removeExtraSpaces
} from '../../src/collectFunctions/collectUtils.js';

// Direct unit tests for the branches in collectUtils.js that the existing
// collect tests never reach (see zoo/test-coverage-plan.md step 8, item 10).

const minimalRecord = new MarcRecord({
  leader: '01092cas a22003494i 4500',
  fields: [
    {tag: '245', ind1: '0', ind2: '0', subfields: [{code: 'a', value: 'Some title /'}, {code: 'b', value: 'part two'}, {code: 'c', value: 'part three'}]}
  ]
}, {subfieldValues: false});

test('hasField returns the single field when no useFunction given', () => {
  const fields = hasField('245', minimalRecord);
  assert.equal(fields.length, 1);
  assert.equal(fields[0].tag, '245');
});

test('hasField returns empty array when the record has no such field', () => {
  assert.deepEqual(hasField('999', minimalRecord), []);
});

test('hasFields returns all fields of a tag', () => {
  const fields = hasFields('245', minimalRecord);
  assert.equal(fields.length, 1);
});

test('hasFields returns empty array for a missing tag', () => {
  assert.deepEqual(hasFields('999', minimalRecord), []);
});

test('getSubfieldValue returns the first matching subfield value', () => {
  const field = minimalRecord.get('245')[0];
  assert.equal(getSubfieldValue(field, 'b'), 'part two');
});

test('getSubfieldValue returns null when the subfield is absent', () => {
  const field = minimalRecord.get('245')[0];
  assert.equal(getSubfieldValue(field, 'z'), null);
});

test('getSubfieldValues returns all matching subfield values', () => {
  const field = minimalRecord.get('245')[0];
  assert.deepEqual(getSubfieldValues(field, 'a'), ['Some title /']);
});

test('getSubfieldValues returns empty array for a field without subfields (sanity check)', () => {
  assert.deepEqual(getSubfieldValues({subfields: undefined}, 'a'), []);
});

test('stripPunc removes a trailing punctuation character or " +"/" ="/" ;"/" :"/" /" sequence', () => {
  assert.equal(stripPunc('Some title.'), 'Some title');
  assert.equal(stripPunc('Some title,'), 'Some title');
  assert.equal(stripPunc('Some title'), 'Some title');
});

test('removeExtraSpaces collapses a run of consecutive spaces to one', () => {
  // NB: the source regex (/ +/u, no 'g' flag) only replaces the FIRST run
  // of spaces — see zoo/work-log-2026-09-25.md Batch 8.
  assert.equal(removeExtraSpaces('a   b  c'), 'a b  c');
  assert.equal(removeExtraSpaces('a b'), 'a b');
});
