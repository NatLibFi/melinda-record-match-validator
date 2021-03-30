
import createDebugLogger from 'debug';
import {compareArrayContent, compareValueContent} from './compareUtils';

const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:compareRecordValues:compareFields');

export function compare042(recordValuesA, recordValuesB) {
  const f042A = recordValuesA['042'];
  const f042B = recordValuesB['042'];
  debug('%o vs %o', f042A, f042B);

  return compareArrayContent(f042A, f042B, true);
}

// 245 n & p
// tosin nää ei varmaan kuitenkaan tuu onixista, eli KV:n ennakkotietotapauksessa toi blokkais kaikki, joissa Melindassa olis tehty noi valmiiksi nimekkeeseen
// niissä tapauksissa, joissa tuodaan alunperin marc21-kirjastodataa tai yhdistetään Melindan tietueita, tää on oleellisehko
export function compare245(recordValuesA, recordValuesB) {
  const f245A = recordValuesA['245'];
  const f245B = recordValuesB['245'];
  debug('%o vs %o', f245A, f245B);

  return {
    'nameOfPartInSectionOfAWork': compareValueContent(f245A.numberOfPartInSectionOfAWork, f245B.numberOfPartInSectionOfAWork),
    'numberOfPartInSectionOfAWork': compareValueContent(f245A.numberOfPartInSectionOfAWork, f245B.numberOfPartInSectionOfAWork),
    'title': compareValueContent(f245A.title, f245B.title)
  };

}

// 300 laajuus

/*
336, 337, 338 $b:t
  automaatiolla pitää miettiä jotain parempaa logiikkaa - mut tekstiaineistoissa jos toinen tietue on 337 $b c ja toinen on 337 $b n niin yhdistämistä ei saa tehdä.
  (Tietokonekäyttöinen teksti ja fyysinen teksti)
*/

export function compare336ContentType(recordValuesA, recordValuesB) {
  const f336A = recordValuesA['336'];
  const f336B = recordValuesB['336'];
  debug('%o vs %o', f336A, f336B);

  return compareArrayContent(f336A.contentType, f336B.contentType);
}

export function compare337MediaType(recordValuesA, recordValuesB) {
  const f337A = recordValuesA['337'];
  const f337B = recordValuesB['337'];
  debug('%o vs %o', f337A, f337B);

  return compareArrayContent(f337A.mediaType, f337B.mediaType);
}

export function compare338CarrierType(recordValuesA, recordValuesB) {
  const f338A = recordValuesA['338'];
  const f338B = recordValuesB['338'];
  debug('%o vs %o', f338A, f338B);

  return compareArrayContent(f338A.carrierType, f338B.carrierType);
}

export function compare773(recordValuesA, recordValuesB) {
  // Matters if starts with (FI-MELINDA) (FIN01) FCC
  const f773sA = recordValuesA['773']
    .filter(field => (/^\(FI-MELINDA\)\d*|^\(FIN01\)\d*|^FCC\d*/u).test(field.recordControlNumber))
    .map(field => ({
      'enumerationAndFirstPage': field.enumerationAndFirstPage,
      'recordControlNumber': field.recordControlNumber.replace(/\(FI-MELINDA\)|\(FIN01\)|FCC/u, ''),
      'relatedParts': field.relatedParts
    }));
  const f773sB = recordValuesB['773']
    .filter(field => (/^\(FI-MELINDA\)\d*|^\(FIN01\)\d*|^FCC\d*/u).test(field.recordControlNumber))
    .map(field => ({
      'enumerationAndFirstPage': field.enumerationAndFirstPage,
      'recordControlNumber': field.recordControlNumber.replace(/\(FI-MELINDA\)|\(FIN01\)|FCC/u, ''),
      'relatedParts': field.relatedParts
    }));
  debug('Collected f773s: %o vs %o', f773sA, f773sB);

  // filter sames out!
  const collectedUniqsA = collectUnique773s(f773sA, f773sB);
  const collectedUniqsB = collectUnique773s(f773sB, f773sA);
  debug('Collected f773s: %o vs %o', collectedUniqsA, collectedUniqsB);

  if (collectedUniqsA.length === 0 && collectedUniqsB.length === 0) {
    debug('All same returning true');
    return true;
  }

  if (collectedUniqsA.length > 0 && f773sB.length === 0) {
    debug('A has uniques and B empty');
    return 'A';
  }

  if (collectedUniqsB.length > 0 && f773sA.length === 0) {
    debug('B has uniques and A empty');
    return 'B';
  }

  // Hard failure if there are 773 $w:s that have a Melinda-ID, but none of the match between records
  if (collectedUniqsA.length === f773sA.length) {
    debug('Both have uniques but non matching');
    return false;
  }

  return false;

  function collectUnique773s(fieldArrayA, fieldArrayB) {
    return fieldArrayA.filter(fieldA => !fieldArrayB.some(fieldB => {
      const enumerationAndFirstPage = fieldA.enumerationAndFirstPage === fieldB.enumerationAndFirstPage;
      const recordControlNumber = fieldA.recordControlNumber === fieldB.recordControlNumber;
      const relatedParts = fieldA.relatedParts === fieldB.relatedParts;
      return enumerationAndFirstPage && recordControlNumber && relatedParts;
    }));
  }
}
