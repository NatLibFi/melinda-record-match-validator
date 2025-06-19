import {hasFields, getSubfield} from './collectFunctions/collectUtils';
import createDebugLogger from 'debug';
//import {compareArrayContent} from './compareFunctions/compareUtils';
import {nvdebug} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:fieldLOW');
const debugDev = debug.extend('dev');
const debugData = debug.extend('data');

export function getLOW(record) {
  const LOWs = hasFields('LOW', record, getSubfield, 'a');
  debugData('LOWs: %o', LOWs);
  return LOWs;
}

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
    return 'A';
  }
  if (score1 < score2) {
    return 'B';
  }
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
  const LOWsA = recordValuesA.LOW;
  const LOWsB = recordValuesB.LOW;
  return compareLOWValues(LOWsA, LOWsB);
}

export function checkLOW({record1, record2}) {
  const low1 = getLOW(record1);
  const low2 = getLOW(record2);
  return compareLOWValues(low1, low2);
}


