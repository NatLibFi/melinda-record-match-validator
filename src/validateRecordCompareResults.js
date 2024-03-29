import createDebugLogger from 'debug';
import {validateFailure} from './validateFunctions/validateFailure';
import {validatePriority} from './validateFunctions/validatePriority';

export function validateCompareResults(comparedRecordValues) {
  const debug = createDebugLogger('@natlibfi/melinda-record-match-validator:validateRecordCompareResults:validateCompareResults');
  debug('Compared record values %o', comparedRecordValues);

  /*
  {
    commonIdentifiers: {
      deleted: All-match = true and defaults = false
      standardIdentifiers: All-match = true, One-all-from-other = A or B, One-has-values-other-empty = A or B and defaults = false
      title: All-match or 50%+ words match in lower case after normalization = true and defaults = false
    },
    '000': {
      typeOfRecord: All-match = true and defaults = false
      bibliographicLevel: All-match = true and defaults = false
      encodingLevel: All-match = true, ranked by array [' ', '1', '2', '3', '4', '5', '7', 'u', 'z', '8'] = A or B and defaults = false
    },
    '001': {
      "isMelindaId": All-true = true, one-is-true = A or B and defaults = false
      "value": All-match = true and defaults = false
    },
    '005': All-match = true (Both have same last modified time), different-times = A or B (More recently modified)
    '042': All-match = true, One-all-from-other = A or B, One-has-values-other-empty = A or B and defaults = false
    '245': {
      nameOfPartInSectionOfAWork: All-match or 50%+ words match in lower case after normalization = true, defaults = false
      numberOfPartInSectionOfAWork: All-match or 50%+ words match in lower case after normalization = true, defaults = false
      title: All-match or 50%+ words match in lower case after normalization = true, defaults = false
    },
    '336': All-match = true, One-all-from-other = A or B and defaults = false
    '337': All-match = true, One-all-from-other = A or B and defaults = false
    '338': All-match = true, One-all-from-other = A or B and defaults = false
    '773': {
      enumerationAndFirstPage: All-match = true, One-all-from-other = A or B, One-has-values-other-empty = A or B and defaults = false,
      recordControlNumbers: All-match = true, One-all-from-other = A or B, One-has-values-other-empty = A or B and defaults = false,
      relatedParts: All-match = true, One-all-from-other = A or B, One-has-values-other-empty = A or B and defaults = false
      tag: '773' or '973'
    },
    SID: All-match = true, One-all-from-other = A or B, One-has-values-other-empty = A or B and defaults = false,
    CAT: Latest-match = true, other-contains-latest-inotherCats = A or B, both-contain-same-old-cat = A or B and defaults = false
    LOW: All-match = true, One-all-from-other = A or B, One-has-values-other-empty = A or B and defaults = false
  }
  */

  // Actions:
  // 'update' = full override (olemassa oleva on ennakko tieto -> uusi on täydennetty)
  // 'merge' = run merge, use profile x and prio A or B (kaksi saman tasoista)
  // 'create' = create new record (ei voida yhdistää)
  // false = send back conflict (joku ongelma)

  // Prio:
  // 'True'
  // 'A'
  // 'B'
  const validationFailureResults = validateFailure(comparedRecordValues);

  if (validationFailureResults.failure) {
    return {action: false, prio: false, message: validationFailureResults.reason};
  }

  return {action: 'merge', prio: validatePriority(comparedRecordValues)};
}
