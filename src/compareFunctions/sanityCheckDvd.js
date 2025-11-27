
//import createDebugLogger from 'debug';
//import {nvdebug} from './utils.js';

//const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:physicalDescription');

function physicalDescriptionContainsDvdVideoLevy(fields300) {
  return fields300.some(field => field.subfields.some(subfield => containsDvdVideolevy(subfield)));

  function containsDvdVideolevy(subfield) {
    if (subfield.code !== 'a') {
      return false;
    }

    if (subfield.value?.match(/DVD-video(?:levy|skiv)/ui)) {
      return true;
    }

    return false;
  }
}

function physicalDescriptionContainsBluRayVideolevy(fields300) {
  return fields300.some(field => field.subfields.some(subfield => containsBluRayVideolevy(subfield)));

  function containsBluRayVideolevy(subfield) {
    if (subfield.code !== 'a') {
      return false;
    }
    // Surprisingly we have 288 Blu-Ray-äänilevy entries, so plain Blu-Ray won't do
    if (subfield.value?.match(/Blu-?Ray-video(?:levy|skiv)/ui)) {
      return true;
    }
    return false;
  }
}

function isDvdVideolevy(record) {
  const fields007 = record.get(/^007$/u);
  if (fields007.some(field => field.value.match(/^v...v/u))) {
    return true;
  }

  const fields = record.get(/^300$/u);
  if (physicalDescriptionContainsDvdVideoLevy(fields)) {
    return true;
  }

  return false;
}

function isBluRayVideolevy(record) {
  const fields007 = record.get(/^007$/u);
  if (fields007.some(field => field.value.match(/^v...s/u))) {
    return true;
  }

  const fields300 = record.get(/^300$/u);
  if (physicalDescriptionContainsBluRayVideolevy(fields300)) {
    return true;
  }

  return false;
}

function getPhysicalDescription(record) {
  return {
    containsDvdVideolevy: isDvdVideolevy(record),
    containsBluRayVideolevy: isBluRayVideolevy(record)
  };
}

export function performDvdSanityCheck({record1, record2}) {
  const results1 = getPhysicalDescription(record1);
  const results2 = getPhysicalDescription(record2);

  // NB! This won't fail if one 300$a has DVD-videolevy and the other one does not.
  // This only fails if one is DVD and the other is Blu-Ray.
  const checkDvd = results1.containsDvdVideolevy || results2.containsDvdVideolevy;
  const checkBluRay = results1.containsBluRayVideolevy || results2.containsBluRayVideolevy;

  if (checkDvd && results1.containsDvdVideolevy !== results2.containsDvdVideolevy) {
    return false;
  }

  if (checkBluRay && results1.containsBluRayVideolevy !== results2.containsBluRayVideolevy) {
    return false;
  }

  return true;
}
