
import {getRecordTitle, getRecordStandardIdentifiers, isDeletedRecord} from '@natlibfi/melinda-commons';
import {getRecordInfo} from './leader';
import {get001, get005, get008} from './controlFields';
import {getCAT} from './fieldCAT';
import {getLOW} from './fieldLOW';
import {getSID} from './fieldSID';
import {get042} from './field042';
import {get245} from './field245';
import {getAllTitleFeatures} from './title';
import {get336bContentType, get337bMediaType, get338bCarrierType} from './field33X';
import {get773} from './field773';

export function collectRecordValues(record) {
  return {
    'commonIdentifiers': {
      title: getRecordTitle(record), // not needed
      standardIdentifiers: getRecordStandardIdentifiers(record),
      deleted: isDeletedRecord(record)
    },
    '000': getRecordInfo(record),
    '001': get001(record),
    '005': get005(record),
    '008': get008(record),
    '042': get042(record),
    '245': get245(record),
    'title': getAllTitleFeatures(record),
    '336': get336bContentType(record),
    '337': get337bMediaType(record),
    '338': get338bCarrierType(record),
    '773': get773(record),
    'CAT': getCAT(record),
    'LOW': getLOW(record),
    'SID': getSID(record)
  };
}
