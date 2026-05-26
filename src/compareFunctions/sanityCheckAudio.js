import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:audio');
const debugDev = debug.extend('dev');
const debugData = debug.extend('data');

//import {nvdebug} from './utils.js';



// NB! f300: only subfield $a is checked. Sometimes other subfields (mainly $e) could contain relevant data.
// NB! I've used Finnish terms in English variables (eg. "checkKasetti"), as kasetti is the most common term that we are looking for.
// NB! Current definition of a music CD is "CD-äänilevy", and "CD-levy" is ignored (it could be cd-rom etc). 

function containsCdAanilevy(subfield) {
  if (subfield.code !== 'a') {
    return false;
  }
  if (subfield.value?.match(/CD-(?:äänilevy|ljudskiv)/ui)) {
    return true;
  }
  return false;
}

function containsLpAanilevy(subfield) {
  if (subfield.code !== 'a') {
    return false;
  }
  if (subfield.value?.match(/LP-(?:äänilevy|levy|ljudskiv|skiv)/ui)) { // LP is always audio, thus "ääni" part is not required
    return true;
  }
  return false;
}

function physicalDescriptionContainsAanikela(fields300) {
  return fields300.some(field => field.subfields.some(subfield => containsAanikela(subfield)));

  function containsAanikela(subfield) {
    if (subfield.code !== 'a') {
      return false;
    }
    if (subfield.value?.match(/(?:audiotape reel|ljudspol(?:e|ar)|äänikela)/ui)) {
      return true;
    }
    return false;
  }
}

function physicalDescriptionContainsAanilevy(fields300) {
  return fields300.some(field => field.subfields.some(subfield => containsAanilevy(subfield)));

  function containsAanilevy(subfield) {
    if (subfield.code !== 'a') {
      return false;
    }
    if (containsCdAanilevy(subfield) || containsLpAanilevy(subfield) || subfield.value?.match(/(?:audio disc|ljudskiv|äänilevy)/ui)) {
      return true;
    }
    return false;
  }
}




function physicalDescriptionContainsCdAanilevy(fields300) {
  return fields300.some(field => field.subfields.some(subfield => containsCdAanilevy(subfield)));
}

function physicalDescriptionContainsKasetti(fields300) {
  // No need to check between C-kasetti and possible other types of cassettes
  return fields300.some(field => field.subfields.some(subfield => containsKasetti(subfield)));

  function containsKasetti(subfield) {
    if (subfield.code !== 'a' || !subfield.value) {
      return false;
    }
    // Prevent videokasetti from giving false positives:
    const value = subfield.value.replace(/video.?[ck]as+ett/iug, 'VIDEO');
    if (value.match(/[ck]as+ett/ui)) { // matches "kasetti", "cassette" "kassett"...
    return true;
  }
  return false;
  }
}

function physicalDescriptionContainsLpAanilevy(fields300) {
  return fields300.some(field => field.subfields.some(subfield => containsLpAanilevy(subfield)));
}



function isAanilevy(record) {
  const fields007 = record.get(/^007$/u);
  if (fields007.some(field => field.value.match(/^sd/u))) {
    return true;
  }

  const fields = record.get(/^300$/u);
  if (physicalDescriptionContainsAanilevy(fields)) {
    return true;
  }

  return false;
}

function isAanikela(record) {
  const fields007 = record.get(/^007$/u);
  if (fields007.some(field => field.value.match(/^st/u))) {
    return true;
  }

  const fields = record.get(/^300$/u);
  if (physicalDescriptionContainsAanikela(fields)) {
    return true;
  }

  return false;
}

function isCdAanilevy(record) {
  const fields007 = record.get(/^007$/u);
  if (fields007.some(field => field.value.match(/^sd.f..g...m/u))) {
    return true;
  }

  const fields = record.get(/^300$/u);
  if (physicalDescriptionContainsCdAanilevy(fields)) {
    return true;
  }

  return false;
}

function isKasetti(record) {
  const fields007 = record.get(/^007$/u);
  if (fields007.some(field => field.value.match(/^ss/u))) {
    return true;
  }

  const fields = record.get(/^300$/u);
  if (physicalDescriptionContainsKasetti(fields)) {
    return true;
  }

  return false;
}

function isLpAanilevy(record) {
  const fields007 = record.get(/^007$/u);
  if (fields007.some(field => field.value.match(/^sd.[cd]..e...p/u))) {
    return true;
  }

  const fields300 = record.get(/^300$/u);
  if (physicalDescriptionContainsLpAanilevy(fields300)) {
    return true;
  }

  return false;
}

function getPhysicalDescription(record) {
  //const fields = record.get(/^300$/u);

  const result = {
    containsCdAanilevy: isCdAanilevy(record),
    containsLpAanilevy: isLpAanilevy(record),
    containsAanilevy : isAanilevy(record),
    containsKasetti: isKasetti(record),
    containsAanikela: isAanikela(record)
  };

  return result;
}

export function performAudioSanityCheck({record1, record2}) {
  const results1 = getPhysicalDescription(record1);
  const results2 = getPhysicalDescription(record2);
  debugData('COMPARE AUDIO TYPES');
  debugData(JSON.stringify(results1));
  debugData(JSON.stringify(results2));
  // NB! This won't fail if one 300$a has CD-äänilevy and the other one does not.
  // This only fails if one is CD and the other is LP.
  const checkLp = results1.containsCdAanilevy || results2.containsCdAanilevy;
  const checkCd = results1.containsLpAanilevy || results2.containsLpAanilevy;

  if (checkCd && results1.containsCdAanilevy !== results2.containsCdAanilevy) {
    return false;
  }


  if (checkLp) { // This is triggered iff a CD is present
    if (results1.containsLpAanilevy !== results2.containsLpAanilevy) {
      return false;
    }
    // Fail if we have CD-äänilevy vs non-CD-äänilevy pair:
    // NB! "checkLP" is triggered iff a CD is present. The rules below aren't necessarily about LP, but it's triggered by checkLp condition.
    if (containsNonCdAanilevy(results1) || containsNonCdAanilevy(results2)) {
      return false;
    }
  }

  // NB! Same as above: won't fail is X has, say, cassette, and the other one has not.
  // Fails only if there unexpected X-vs-Y combinations:
  const checkKasetti = results1.containsAanilevy || results2.containsAanilevy || results1.containsAanikela || results2.containsAanikela;
  const checkAanilevy = results1.containsKasetti || results2.containsKasetti || results1.containsAanikela || results2.containsAanikela;
  const checkAanikela =  results1.containsAanilevy || results2.containsAanilevy || results1.containsKasetti || results2.containsKasetti;

  if (checkKasetti && results1.containsKasetti !== results2.containsKasetti) {
    return false;
  }
  if (checkAanilevy && results1.containsAanilevy !== results2.containsAanilevy) {
    return false;
  }

  if (checkAanikela && results1.containsAanikela !== results2.containsAanikela) {
    return false;
  }
  return true;

  function containsNonCdAanilevy(results) {
    if (results.containsCdAanilevy) {
      return false;
    }
    return results.containsAanilevy;
  }
}
