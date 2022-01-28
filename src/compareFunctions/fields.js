
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



