function stripControlNumberPart(id) {
  // return "(FOO)" from "(FOO)BAR"
  if ((/^\([^)]+\)[0-9]+$/u).test(id)) {
    return id.substr(0, id.indexOf(')') + 1);
  }
  return null; // Not exactly sure what failure should return...
}

export function sameControlNumberIdentifier(id1, id2) { // Same parenthesis part
  if (id1 === id2) {
    return true;
  } // eg. "(FOO)BAR" === "(FOO)BAR"
  if (stripControlNumberPart(id1) === stripControlNumberPart(id2)) {
    return true;
  } // "(FOO)LORUM" vs "(FOO)IPSUM"
  return false; // IDs come from different databases
}


export function fieldToString(f) {
  if ('subfields' in f) {
    return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;
  }
  return `${f.tag}    ${f.value}`;
  function formatSubfields(field) {
    return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
  }
}

export function isControlSubfieldCode(subfieldCode) {
  if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'w'].includes(subfieldCode)) {
    return true;
  }
  return false;
}

export function fieldHasSubfield(field, subfieldCode, subfieldValue = null) {
  if (subfieldValue === null) {
    return field.subfields.some(sf => sf.code === subfieldCode);
  }
  return field.subfields.some(sf => sf.code === subfieldCode && subfieldValue === sf.value);
}


