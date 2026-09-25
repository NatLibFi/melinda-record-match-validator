
import assert from 'node:assert';
import {test} from 'node:test';
import {
  normalizeMelindaId,
  isValidNormalizedMelindaId,
  splitIds,
  hasIdMismatch,
  hasIdMatch
} from '../src/utils.js';

test('normalizeMelindaId()', (t) => {
  t.test('converts FCC-prefixed id to (FI-MELINDA) id', () => {
    assert.deepEqual(normalizeMelindaId('FCC123456789'), '(FI-MELINDA)123456789');
  });

  t.test('converts (FIN01) id to (FI-MELINDA) id', () => {
    assert.deepEqual(normalizeMelindaId('(FIN01)123456789'), '(FI-MELINDA)123456789');
  });

  t.test('leaves (FI-MELINDA) id unchanged', () => {
    assert.deepEqual(normalizeMelindaId('(FI-MELINDA)123456789'), '(FI-MELINDA)123456789');
  });

  t.test('leaves unrelated values unchanged', () => {
    assert.deepEqual(normalizeMelindaId('FOO'), 'FOO');
    assert.deepEqual(normalizeMelindaId('(FIN01)12345678'), '(FIN01)12345678'); // too short (8 digits)
    assert.deepEqual(normalizeMelindaId('FCC12345678'), 'FCC12345678'); // too short (8 digits)
    assert.deepEqual(normalizeMelindaId('fcc123456789'), 'fcc123456789'); // lower-case not converted
    // NOTE: Future consideration - should we case-insensitively accept ID values?
    // E.g., 'FCC123456789', 'fcc123456789', 'Fcc123456789' should all normalize to '(FI-MELINDA)123456789'.
    // Current behavior only accepts exact case matches (FCC, FIN01, FI-MELINDA).
    // Adding case-insensitive matching would improve robustness for data entry variations
    // but could mask typos or indicate downstream data quality issues.
  });
});

test('isValidNormalizedMelindaId()', (t) => {
  t.test('accepts valid (FI-MELINDA) id', () => {
    assert.equal(isValidNormalizedMelindaId('(FI-MELINDA)123456789'), true);
  });

  t.test('accepts (FI-MELINDA) id at end of a longer value', () => {
    // The regex uses $ (end anchor) but not ^ (start anchor), so it matches
    // if the string ends with a valid Melinda ID. This is intentionally lenient
    // to handle edge cases where raw field values might contain surrounding text.
    // In normal usage, IDs pass through normalizeMelindaId() first which strips
    // non-matching values, but this documents the function's actual behavior.
    assert.equal(isValidNormalizedMelindaId('host (FI-MELINDA)123456789'), true);
  });

  t.test('rejects invalid values', () => {
    assert.equal(isValidNormalizedMelindaId('123456789'), false); // no prefix
    assert.equal(isValidNormalizedMelindaId('(FI-MELINDA)12345678'), false); // 8 digits - too short
    // NOTE: Short IDs (fewer than 9 digits) are rejected rather than padded with leading zeros.
    // Question for future consideration: should we pad short IDs with leading zeros during normalization?
    // E.g., '(FI-MELINDA)12345678' → '(FI-MELINDA)012345678'? This would require knowing the intended
    // digit width and could mask data quality issues. Current behavior prefers explicit rejection.
    assert.equal(isValidNormalizedMelindaId('(FI-MELINDA)1234567890'), false); // 10 digits
    assert.equal(isValidNormalizedMelindaId('(FIN01)123456789'), false); // other prefix
  });
});

test('splitIds()', (t) => {
  t.test('splits mixed ids into internal and other, deduplicated', () => {
    const {internalIds, otherIds} = splitIds(['FCC123456789', '(FI-MELINDA)123456789', 'FOO', 'FOO']);
    assert.deepEqual(internalIds, ['(FI-MELINDA)123456789']);
    assert.deepEqual(otherIds, ['FOO']);
  });

  t.test('returns empty arrays for empty input', () => {
    const {internalIds, otherIds} = splitIds([]);
    assert.deepEqual(internalIds, []);
    assert.deepEqual(otherIds, []);
  });

  t.test('keeps distinct external ids separately', () => {
    const {internalIds, otherIds} = splitIds(['CCF123456789', '(FI-MELINDA)876543210']);
    assert.deepEqual(internalIds, ['(FI-MELINDA)876543210']);
    assert.deepEqual(otherIds, ['CCF123456789']);
  });
});

test('hasIdMismatch()', (t) => {
  t.test('same value in set is not a mismatch', () => {
    assert.equal(hasIdMismatch('(FI-HELSU)123456789', ['(FI-HELSU)123456789']), false);
  });

  t.test('same source prefix but different id is a mismatch', () => {
    assert.equal(hasIdMismatch('(FI-HELSU)123456789', ['(FI-HELSU)876543210']), true);
  });

  t.test('different source prefix is not a mismatch', () => {
    // (FI-HELSU) is an imaginary prefix for a different source system (unlike FIN01,
    // which is just an internal Aleph variant of the Melinda (FI-MELINDA) source).
    // Different source systems may legitimately assign different IDs to the same item,
    // so different prefixes are not a mismatch.
    assert.equal(hasIdMismatch('(FI-HELSU)123456789', ['(FI-MELINDA)123456789']), false);
  });

  t.test('id without source prefix only mismatches other prefix-less ids', () => {
    assert.equal(hasIdMismatch('123456789', ['(FI-HELSU)876543210']), false);
    assert.equal(hasIdMismatch('123456789', ['876543210']), true);
  });
});

test('hasIdMatch()', (t) => {
  t.test('identical value in set is a match', () => {
    assert.equal(hasIdMatch('(FI-MELINDA)123456789', ['FOO', '(FI-MELINDA)123456789']), true);
  });

  t.test('different values are not a match (even with same prefix)', () => {
    assert.equal(hasIdMatch('(FI-MELINDA)123456789', ['(FI-MELINDA)876543210']), false);
  });

  t.test('no match in empty set', () => {
    assert.equal(hasIdMatch('(FI-MELINDA)123456789', []), false);
  });
});
