const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

export function filterClassMembers(members, search) {
  const term = normalize(search);
  if (!term) return members;
  return members.filter((member) => normalize(member.name).includes(term));
}
