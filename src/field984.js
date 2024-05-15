
// Implements MRA-744
export function check984({record1, record2}) {
  const score1 = score984(record1);
  const score2 = score984(record2);
  // Should we use more generic score1 > score2? Does not having a 260/264 field imply badness?
  // Currently
  if (score1 > score2) {
    return 'A';
  }
  if (score2 > score1) {
    return 'B';
  }
  return true;

  function score984(currRecord) {
    const fields984 = currRecord.fields.filter(f => f.tag === '984');

    if (fields984.some(f => isPreferred(f))) {
      return 1;
    }
    if (fields984.some(f => isSnubbed(f))) {
      return -1;
    }
    return 0;
  }

  function isPreferred(field) {
    if (field.tag !== '984') {
      return false;
    }
    return field.subfields.some(sf => sf.code === 'a' && sf.value === 'ALWAYS-PREFER-IN-MERGE');
  }

  function isSnubbed(field) {
    if (field.tag !== '984') {
      return false;
    }
    return field.subfields.some(sf => sf.code === 'a' && sf.value === 'NEVER-PREFER-IN-MERGE');
  }
}
