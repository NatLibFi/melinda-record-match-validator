import createDebugLogger from 'debug';

export function getRecordInfo(record) {
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:collectRecordValues:leader');

  const {leader} = record;
  const [,,,,, recordStateRaw, recordTypeRaw, recordBibLevelRaw,,,,,,,,,, recordCompletionLevel] = leader;

  debug('Record state raw: %o', recordStateRaw);
  debug('Record type raw: %o', recordTypeRaw);
  debug('Record bib level raw: %o', recordBibLevelRaw);
  debug('Record completion level raw: %o', recordCompletionLevel);

  return {
    recordState: getRecordState(),
    recordType: getRecordType(),
    recordBibLevel: getRecordBibLevel(),
    recordCompletionLevel: getRecordCompletionLevel()
  };

  function getRecordState() {
    if (recordStateRaw === 'a') {
      return 'updated';
    }

    if (recordStateRaw === 'c') {
      return 'fixed';
    }

    if (recordStateRaw === 'd') {
      return 'deleted';
    }

    if (recordStateRaw === 'n') {
      return 'new';
    }

    if (recordStateRaw === 'p') {
      return 'updated foreknowledge';
    }

    throw new Error('Invalid record state');
  }

  function getRecordType() {
    if (recordTypeRaw === 'a') {
      return 'text material';
    }

    if (recordTypeRaw === 'c') {
      return 'sheet music release';
    }

    if (recordTypeRaw === 'd') {
      return 'sheet music script';
    }

    if (recordTypeRaw === 'e') {
      return 'map material';
    }

    if (recordTypeRaw === 'f') {
      return 'map script';
    }

    if (recordTypeRaw === 'g') {
      return 'projectable medium';
    }

    if (recordTypeRaw === 'i') {
      return 'voice record';
    }

    if (recordTypeRaw === 'j') {
      return 'music record';
    }

    if (recordTypeRaw === 'k') {
      return 'image';
    }

    if (recordTypeRaw === 'm') {
      return 'electronic material';
    }

    if (recordTypeRaw === 'o') {
      return 'multicast';
    }

    if (recordTypeRaw === 'p') {
      return 'random material';
    }

    if (recordTypeRaw === 'r') {
      return 'item';
    }

    if (recordTypeRaw === 't') {
      return 'text script';
    }

    throw new Error('Invalid record type');
  }

  function getRecordBibLevel() {

    if (recordBibLevelRaw === 'a') {
      return 'sub-item in the monograph';
    }

    if (recordBibLevelRaw === 'b') {
      return 'sub-item in the periodical';
    }

    if (recordBibLevelRaw === 'c') {
      return 'collection';
    }

    if (recordBibLevelRaw === 'd') {
      return 'sub-item in the collection';
    }

    if (recordBibLevelRaw === 'i') {
      return 'updated publication';
    }

    if (recordBibLevelRaw === 'm') {
      return 'monograph';
    }

    if (recordBibLevelRaw === 's') {
      return 'periodical';
    }

    throw new Error('Invalid record bib level');
  }

  function getRecordCompletionLevel() {

    if (recordCompletionLevel === ' ') {
      return 'perfect - certified';
    }
    if (recordCompletionLevel === '1') {
      return 'perfect - non certified';
    }
    if (recordCompletionLevel === '2') {
      return 'scarcer than perfect, non certified';
    }
    if (recordCompletionLevel === '3') {
      return 'scarcer than minimum recommended level';
    }
    if (recordCompletionLevel === '4') {
      return 'intermediate level';
    }
    if (recordCompletionLevel === '5') {
      return 'foreknowledge';
    }
    if (recordCompletionLevel === '7') {
      return 'unknown';
    }
    if (recordCompletionLevel === '8') {
      return 'Unsuitable';
    }


    throw new Error('Invalid record completion level');
  }
}
