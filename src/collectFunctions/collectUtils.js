export function hasFields(tag, record, useFunction, useFunctionParameters) {
  const fields = record.get(tag);
  if (fields === []) {
    return [];
  }

  if (useFunction !== undefined) {
    return fields.map(field => useFunction(field, useFunctionParameters));
  }

  return fields;
}

// Check 773 multiple sub code w & g
// Check 245 multiple sub code n & p
// Check 042 multiple sub code a

export function getSubfield(field, subfieldCode) {
  const [value] = field.subfields.filter(sub => sub.code === subfieldCode).map(sub => sub.value);

  if (value === undefined) {
    return 'undefined';
  }

  return value;
}
