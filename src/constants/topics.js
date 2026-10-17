// Topic enum (MODELAGEM_BANCO.md, section 5.16)
export const TOPICS = {
  cytology: { label: 'Citologia', grade: 1, mascot: 'mito' },
  biochemistry: { label: 'Bioquímica', grade: 1, mascot: 'mito' },
  microbiology: { label: 'Microbiologia', grade: 1, mascot: 'medusa' },
  anatomy: { label: 'Anatomia e Fisiologia', grade: 1, mascot: 'teco' },
  zoology: { label: 'Zoologia', grade: 2, mascot: 'mandu' },
  botany: { label: 'Botânica', grade: 2, mascot: 'sapo' },
  marine_biology: { label: 'Biologia Marinha', grade: 2, mascot: 'baleia' },
  genetics: { label: 'Genética', grade: 3, mascot: 'borbo' },
  ecology: { label: 'Ecologia', grade: 3, mascot: 'dinho' },
  biomes: { label: 'Biomas do Brasil', grade: 3, mascot: 'guara' },
  biotechnology: { label: 'Biotecnologia', grade: 3, mascot: 'abelha' },
};

export const topicLabel = (topic) => TOPICS[topic]?.label ?? topic;
