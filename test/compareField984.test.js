import assert from 'node:assert';
import {test} from 'node:test';
import {check984} from '../src/compareFunctions/compareField984.js';

function makeRecord(fields = []) {
  return { fields };
}

test('check984()', (t) => {
  t.test('both records neutral (no 984 fields) → true', () => {
    const result = check984({
      record1: makeRecord(),
      record2: makeRecord()
    });
    assert.equal(result, true);
  });

  t.test('A preferred, B neutral → A', () => {
    const result = check984({
      record1: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'ALWAYS-PREFER-IN-MERGE' }] }]),
      record2: makeRecord()
    });
    assert.equal(result, 'A');
  });

  t.test('A snubbed, B neutral → B', () => {
    const result = check984({
      record1: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'NEVER-PREFER-IN-MERGE' }] }]),
      record2: makeRecord()
    });
    assert.equal(result, 'B');
  });

  t.test('A preferred, B snubbed → A', () => {
    const result = check984({
      record1: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'ALWAYS-PREFER-IN-MERGE' }] }]),
      record2: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'NEVER-PREFER-IN-MERGE' }] }])
    });
    assert.equal(result, 'A');
  });

  t.test('A neutral, B preferred → B', () => {
    const result = check984({
      record1: makeRecord(),
      record2: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'ALWAYS-PREFER-IN-MERGE' }] }])
    });
    assert.equal(result, 'B');
  });

  t.test('A neutral, B snubbed → A', () => {
    const result = check984({
      record1: makeRecord(),
      record2: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'NEVER-PREFER-IN-MERGE' }] }])
    });
    assert.equal(result, 'A');
  });

  t.test('A snubbed, B preferred → B', () => {
    const result = check984({
      record1: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'NEVER-PREFER-IN-MERGE' }] }]),
      record2: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'ALWAYS-PREFER-IN-MERGE' }] }])
    });
    assert.equal(result, 'B');
  });

  t.test('both preferred → true (tie)', () => {
    const result = check984({
      record1: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'ALWAYS-PREFER-IN-MERGE' }] }]),
      record2: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'ALWAYS-PREFER-IN-MERGE' }] }])
    });
    assert.equal(result, true);
  });

  t.test('both snubbed → true (tie)', () => {
    const result = check984({
      record1: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'NEVER-PREFER-IN-MERGE' }] }]),
      record2: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'NEVER-PREFER-IN-MERGE' }] }])
    });
    assert.equal(result, true);
  });

  t.test('A has preferred+snubbed (preferred wins), B neutral → A', () => {
    const result = check984({
      record1: makeRecord([
        { tag: '984', subfields: [{ code: 'a', value: 'ALWAYS-PREFER-IN-MERGE' }] },
        { tag: '984', subfields: [{ code: 'a', value: 'NEVER-PREFER-IN-MERGE' }] }
      ]),
      record2: makeRecord()
    });
    assert.equal(result, 'A');
  });

  t.test('non-984 fields ignored', () => {
    const result = check984({
      record1: makeRecord([{ tag: '245', subfields: [{ code: 'a', value: 'Test' }] }]),
      record2: makeRecord()
    });
    assert.equal(result, true);
  });

  t.test('984 with other subfield values treated as neutral', () => {
    const result = check984({
      record1: makeRecord([{ tag: '984', subfields: [{ code: 'a', value: 'SOME-OTHER-VALUE' }] }]),
      record2: makeRecord()
    });
    assert.equal(result, true);
  });

  t.test('multiple 984 fields: preferred in any (no snubbed) → preferred', () => {
    const result = check984({
      record1: makeRecord([
        { tag: '984', subfields: [{ code: 'a', value: 'SOME-OTHER-VALUE' }] },
        { tag: '984', subfields: [{ code: 'a', value: 'ALWAYS-PREFER-IN-MERGE' }] }
      ]),
      record2: makeRecord()
    });
    assert.equal(result, 'A');
  });

  t.test('multiple 984 fields: snubbed in any (no preferred) → snubbed', () => {
    const result = check984({
      record1: makeRecord([
        { tag: '984', subfields: [{ code: 'a', value: 'SOME-OTHER-VALUE' }] },
        { tag: '984', subfields: [{ code: 'a', value: 'NEVER-PREFER-IN-MERGE' }] }
      ]),
      record2: makeRecord()
    });
    assert.equal(result, 'B');
  });
});
