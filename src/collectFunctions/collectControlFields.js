import moment from 'moment';
import createDebugLogger from 'debug';

import {getDefaultMissValue} from './collectUtils.js';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectFunctions/collectControlFields');
const debugDev = debug.extend('dev');

export function get001(record) {

  const [f001Value] = record.get('001').map(field => field.value);
  const [f003Value] = record.get('003').map(field => field.value);

  const isMelindaId = f003Value === 'FI-MELINDA';
  debugDev('Record f001 value: %o', f001Value);
  debugDev('Record f001 value is melinda id: %o', isMelindaId);

  return {value: f001Value || getDefaultMissValue(), isMelindaId};
}

export function get005(record) {
  const [f005Value] = record.get('005').map(field => field.value);

  const time = moment(f005Value, ['YYYYMMDDHHmmss.S'], true).format('YYYY-MM-DDTHH:mm:ss');
  debugDev('Last modification time: %o', time);

  return time;
}

// 008-all materials 06 - Type of date/Publication status
// https://www.loc.gov/marc/bibliographic/bd008a.html
const publicationStatusHash = {
  'b': 'No dates given; B.C. date involved',
  'c': 'Continuing resource currently published',
  'd': 'Continuing resource ceased publication',
  'e': 'Detailed date',
  'i': 'Inclusive dates of collection',
  'k': 'Range of year of bulk of collection',
  'm': 'Multiple dates',
  'n': 'Dates unknown',
  'p': 'Date of distribution/release/issue and production/recording session when different',
  'q': 'Questionable date',
  'r': 'Reprint/reissue date and original date',
  's': 'Single known/probable date',
  't': 'Publication date and copyright date',
  'u': 'Continuing resource status unknown',
  '|': 'No attempt to code'
};

// 008-all materials 39 - Cataloging source
// https://www.loc.gov/marc/bibliographic/bd008a.html
const catalogingSourceHash = {
  ' ': 'National bibliographical agency',
  'c': 'Cooperative cataloging program',
  'd': 'Other',
  'u': 'Unknown',
  '|': 'No attempt to code'
};

//
// 008-BK/CF/MU/SE/MX 23 - Form of item
// 008-MP/VM 29 - Form of item
//https://www.loc.gov/marc/bibliographic/bd008.html
const formOfItemHash = {
  ' ': 'None of the following, expect for CF unknown or not specified',
  'a': 'Microfilm',
  'b': 'Microfiche',
  'c': 'Microopaque',
  'd': 'Large print',
  'f': 'Braille',
  'o': 'Online',
  'q': 'Direct electronic',
  'r': 'Regular print reproduction',
  's': 'Electronic',
  '|': 'No attempt to code'
};

export function get008(record) {
  const [f008Value] = record.get('008').map(field => field.value);

  const publicationStatus = f008Value ? f008Value[6] : '|';
  const catalogingSource = f008Value ? f008Value[39] : '|';
  const formOfItem = getFormOfItem();
  //nvdebug(` get008(): ${publicationStatus}, ${catalogingSource}, ${formOfItem}`);
  //console.log(`LDR/07 ${recordBibLevelRaw}`); // eslint-disable-line no-console
  //debug('Record type raw: %o', recordTypeRaw);
  //debug('Record bib level raw: %o', recordBibLevelRaw);
  //debug('Record completion level raw: %o', recordCompletionLevel);

  const result = {
    catalogingSource: mapCatalogingSource(catalogingSource),
    publicationStatus: mapPublicationStatus(publicationStatus),
    formOfItem: mapFormOfItem(formOfItem)
  };
  return result;

  function getFormOfItem() {
    if (!f008Value) {
      return '|';
    }
    if (record.isMP() || record.isVM()) {
      return f008Value[29];
    }
    return f008Value[23];
  }

  function mapPublicationStatus(publicationStatus) {
    const tmp = publicationStatus in publicationStatusHash ? publicationStatus : '|';
    return {level: publicationStatusHash[tmp], code: tmp};
  }

  function mapCatalogingSource(catalogingSource) {
    const tmp = catalogingSource in catalogingSourceHash ? catalogingSource : '|';
    return {level: catalogingSourceHash[tmp], code: tmp};
  }

  function mapFormOfItem(formOfItemCode) {
    const tmp = formOfItemCode in formOfItemHash ? formOfItemCode : '|';
    return {form: formOfItemHash[tmp], code: tmp};
  }

}