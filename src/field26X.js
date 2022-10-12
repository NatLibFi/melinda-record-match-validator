export function getPublisherFields(record) {
  return record.fields.filter(field => isPublisherField(field));

  function isPublisherField(field) {
    if (field.tag === '260') {
      return true;
    }
    return field.tag === '264' && field.ind2 === '1';
  }
}

export function checkPublisher({record1, record2}) {
  const score1 = publisherScore(getPublisherFields(record1));
  const score2 = publisherScore(getPublisherFields(record2));
  // Should we use more generic score1 > score2? Does not having a 260/264 field imply badness?
  // Currently
  if (score1 > score2) {
    return 'A';
  }
  if (score2 > score1) {
    return 'B';
  }
  return true;

  function publisherScore(fields) {
    // 264 (with ind2=1) is contains the publisher as per RDA. This is the best possible scenario.
    if (fields.some(field => field.tag === '264')) {
      return 2;
    }
    // 260 contains the traditional non-RDA publisher info.
    // Originally we had 264 < 260 < no publisher. However, we don't want to prefer a definitely non-RDA record,
    // thus this is currently ignored.
    if (fields.some(field => field.tag === '260')) {
      return 0;
    }
    return 0;
  }
}
