
import createDebugLogger from 'debug';
//import {compareArrayContent} from './compareUtils.js';
import {nvdebug} from '../utils.js';
import {getLOW} from '../collectFunctions/collectUtils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:fieldLOW');
const debugDev = debug.extend('dev');
const debugData = debug.extend('data');

// Priority array for various LOW tags. Default value for an existing LOW is 50, and for no LOW 0.
const LOW2Points = {
  'FIKKA': 100,
  // DEVELOP: there's no FENNICA LOW ...
  'FENNICA': 90,
  'VIOLA': 90,
  // 'HELKA': 80, // We could add more libraries here. Eg. HELKA is usually good.
  'undefined': 0 // not sure whether this default can happen here
};


function compareLOWValues(LOWsA, LOWsB) {
  debugDev('compareLOW: A: %o vs B: %o', LOWsA, LOWsB);

  // return compareArrayContent(LOWsA, LOWsB, true); // NV: size does not matter

  const score1 = lowFieldsToScore(LOWsA);
  const score2 = lowFieldsToScore(LOWsB);
  nvdebug(`LOW scores: ${score1} vs ${score2}`, debugDev);
  if (score1 > score2) {
    nvdebug(`LOW scores: A win ${score1} vs ${score2}`, debugDev);
    return 'A';
  }
  if (score1 < score2) {
    nvdebug(`LOW scores: B win ${score1} vs ${score2}`, debugDev);
    return 'B';
  }
  nvdebug(`LOW scores: same ${score1} vs ${score2}`, debugDev);
  return true; // never blocks

  function lowFieldsToScore(lows) {
    // min=0, max=100
    if (lows === undefined || lows.length === 0) { // Having no LOW fields is pretty suspicious
      return 0;
    }
    //const low2Score = lows.map(low => scoreField(low));
    //debug(' mapped to %o', low2Score);

    return Math.max(...lows.map(low => scoreField(low)));
  }


  function scoreField(value) {
    if (!value) {
      return 0;
    }

    if (value in LOW2Points) {
      return LOW2Points[value];
    }

    // If we'd want to, we could add some kind of priority based on organizations.
    // However, we wouldn't be making friends there: If X > Y, then Y might hurt his feelings.
    return 50;
  }
}

export function compareLOW(recordValuesA, recordValuesB) {
  debugData(`We got recordValuesA (compareLOW): ${JSON.stringify(recordValuesA)}`);
  debugData(`We got recordValuesB (compareLOW): ${JSON.stringify(recordValuesB)}`);
  const LOWsA = recordValuesA.LOW;
  const LOWsB = recordValuesB.LOW;
  return compareLOWValues(LOWsA, LOWsB);
}

export function compareLOWinternal(recordValuesA, recordValuesB) {
  debugData(`We got recordValuesA (compareLowInternal): ${JSON.stringify(recordValuesA)}`);
  debugData(`We got recordValuesB (compareLowInternal): ${JSON.stringify(recordValuesB)}`);
  const LOWsA = recordValuesA.LOW || recordValuesA;
  const LOWsB = recordValuesB.LOW || recordValuesB;
  debugData(`We got LOWsA: ${JSON.stringify(LOWsA)}`);
  debugData(`We got LOWsB: ${JSON.stringify(LOWsB)}`);
  if (LOWsA.some(low => LOWsB.includes(low))) {
    return false;
  }
  return true;
}


export function checkLOW({record1, record2}) {
  const low1 = getLOW(record1);
  const low2 = getLOW(record2);
  return compareLOWValues(low1, low2);
}

export function checkLOWinternal({record1, record2}) {
  const low1 = getLOW(record1);
  const low2 = getLOW(record2);
  debugData('LOWs A: %o', low1);
  debugData('LOWs B: %o', low2);
  return compareLOWinternal(low1, low2);
}

