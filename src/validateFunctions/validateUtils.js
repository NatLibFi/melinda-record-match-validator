export function isValidValue(value, arrayOfValidValues) {
  if (arrayOfValidValues.includes(value)) {
    return value;
  }

  return false;
}
