
import createDebugLogger from 'debug';
import {nvdebug} from './utils';
import {hasField, getSubfields} from './collectFunctions/collectUtils';
//import {compareArrayContent} from './compareUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field042');

export function get042(record) {
  return hasField('042', record, getSubfields, 'a');
}

function compare042Data(data1, data2) {
  // Look for NatLibFi authentication codes (finb and finbd) from within 042$a subfields, and give one point for each of the two.
  const score1 = score042Field(data1);
  const score2 = score042Field(data2);
  nvdebug(`042 scores: ${score1} vs ${score2}`);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }
  return true; // This test does not fail

  function score042Field(authenticationCodes) {
    nvdebug('FFS', debug);
    nvdebug(authenticationCodes.join(', '), debug);
    return (authenticationCodes.includes('finb') ? 1 : 0) + (authenticationCodes.includes('finbd') ? 1 : 0);
  }

}

export function compare042(recordValuesA, recordValuesB) {
  const f042A = recordValuesA['042'];
  const f042B = recordValuesB['042'];
  debug('%o vs %o', f042A, f042B);
  // We no longer use the generic functions as we are interested only in two specific values
  return compare042Data(f042A, f042B);

  //return compareArrayContent(f042A, f042B, true);
}

export function check042({record1, record2}) {
  const data1 = get042(record1);
  const data2 = get042(record2);
  return compare042Data(data1, data2);
}
