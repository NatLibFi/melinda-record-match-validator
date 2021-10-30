function fieldToString(f) {
    if ('subfields' in f) {
      return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;
    }
    return `${f.tag}    ${f.value}`;
    function formatSubfields(field) {
      return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
    }
}