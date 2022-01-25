
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
    'nameOfPartInSectionOfAWork': compareValueContent(f245A.numberOfPartInSectionOfAWork, f245B.numberOfPartInSectionOfAWork, '245 name: '),
    'numberOfPartInSectionOfAWork': compareValueContent(f245A.numberOfPartInSectionOfAWork, f245B.numberOfPartInSectionOfAWork, '245 number: '),
    'title': compareValueContent(f245A.title, f245B.title, '245 title: ')
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


