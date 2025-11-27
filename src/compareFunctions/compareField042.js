
import createDebugLogger from 'debug';
import {nvdebug} from '../utils.js';
import {get042} from '../collectFunctions/collectUtils.js';
//import {compareArrayContent} from './compareUtils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:field042');
const debugDev = debug.extend('dev');
//const debugData = debug.extend('data');

function compare042Data(data1, data2) {
  // Look for NatLibFi authentication codes (finb and finbd) from within 042$a subfields, and give one point for each of the two.
  const score1 = score042Field(data1);
  const score2 = score042Field(data2);
  nvdebug(`042 scores: ${score1} vs ${score2}`, debugDev);
  if (score1 > score2) {
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }
  return true; // This test does not fail

  function score042Field(authenticationCodes) {
    nvdebug(authenticationCodes.join(', '), debugDev);
    // Uh, nowadays I think that finb + finbd is 1, not 2... Well, I'll come back to this eventually (or not)...
    return (authenticationCodes.includes('finb') ? 1 : 0) + (authenticationCodes.includes('finbd') ? 1 : 0);
  }

}

export function compare042(recordValuesA, recordValuesB) {
  const f042A = recordValuesA['042'];
  const f042B = recordValuesB['042'];
  debugDev('%o vs %o', f042A, f042B);
  // We no longer use the generic functions as we are interested only in two specific values
  return compare042Data(f042A, f042B);

  //return compareArrayContent(f042A, f042B, true);
}

export function check042({record1, record2}) {
  const data1 = get042(record1);
  const data2 = get042(record2);
  return compare042Data(data1, data2);
}
