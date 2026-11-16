// Banco pedagógico e tutor de Biologia para modo offline e fallback de segurança

export const BIOLOGY_QUESTION_BANK = {
  cytology: [
    {
      text: "Qual organela citoplasmática é conhecida como a 'usina de energia' da célula por realizar a respiração celular?",
      options: ["Complexo Golgiense", "Mitocôndria", "Ribossomo", "Retículo Endoplasmático"],
      answer: 1,
      explanation: "A mitocôndria é responsável pela produção de ATP através do ciclo de Krebs e da cadeia respiratória."
    },
    {
      text: "O modelo do Mosaico Fluido descreve a estrutura de qual elemento celular?",
      options: ["Parede celular", "Membrana plasmática", "Carioteca", "Citoesqueleto"],
      answer: 1,
      explanation: "Proposto por Singer e Nicolson, descreve a bicamada de fosfolipídios com proteínas que se movem lateralmente."
    },
    {
      text: "Células procariontes, como as bactérias, diferenciam-se das eucariontes principalmente pela:",
      options: ["Ausência de ribossomos", "Ausência de carioteca delimitando o núcleo", "Presença de mitocôndrias", "Ausência de material genético"],
      answer: 1,
      explanation: "Procariontes não possuem envoltório nuclear (carioteca), mantendo seu DNA circular disperso no citoplasma."
    },
    {
      text: "Qual organela é responsável pela autofagia e digestão intracelular na célula animal?",
      options: ["Lisossomo", "Centríolo", "Peroxissomo", "Vacúolo"],
      answer: 0,
      explanation: "Os lisossomos contêm enzimas hidrolíticas ativas em pH ácido para digestão de partículas e organelas velhas."
    },
    {
      text: "Durante a mitose, em qual fase os cromossomos se alinham na placa equatorial da célula?",
      options: ["Prófase", "Metáfase", "Anáfase", "Telófase"],
      answer: 1,
      explanation: "Na metáfase, os cromossomos atingem seu grau máximo de condensação e se posicionam no equador do fuso mitótico."
    }
  ],
  genetics: [
    {
      text: "Na molécula de DNA, qual base nitrogenada sempre pareia com a adenina através de duas ligações de hidrogênio?",
      options: ["Citosina", "Timina", "Guanina", "Uracila"],
      answer: 1,
      explanation: "No DNA, a Adenina sempre se liga à Timina (A=T), e a Guanina à Citosina (G≡C)."
    },
    {
      text: "Um indivíduo heterozigoto para uma característica com dominância completa possui genótipo:",
      options: ["AA", "Aa", "aa", "A_"],
      answer: 1,
      explanation: "Heterozigoto significa que o indivíduo apresenta dois alelos diferentes para o mesmo gene (Aa)."
    },
    {
      text: "Qual processo converte a informação contida no RNA mensageiro em uma sequência de aminoácidos?",
      options: ["Transcrição", "Tradução", "Replicação", "Splicing"],
      answer: 1,
      explanation: "A tradução ocorre nos ribossomos, onde os códons do RNAm são lidos com auxílio dos RNAs transportadores."
    }
  ],
  ecology: [
    {
      text: "Em uma cadeia alimentar, os organismos que realizam a síntese de matéria orgânica a partir de energia luminosa são os:",
      options: ["Decompositores", "Produtores", "Consumidores primários", "Consumidores secundários"],
      answer: 1,
      explanation: "Os produtores autotróficos (como plantas e algas) fixam o carbono e iniciam o fluxo de energia nos ecossistemas."
    },
    {
      text: "A relação ecológica entre abelhas e flores, onde ambas as espécies se beneficiam, é classificada como:",
      options: ["Parasitismo", "Mutualismo", "Comensalismo", "Predatismo"],
      answer: 1,
      explanation: "O mutualismo é uma interação harmônica interespecífica benéfica para ambos os participantes."
    },
    {
      text: "O processo no qual compostos químicos tóxicos aumentam de concentração ao longo dos níveis tróficos de uma cadeia é chamado de:",
      options: ["Eutrofização", "Magnificação trófica (bioacumulação)", "Sucessão primária", "Nicho ecológico"],
      answer: 1,
      explanation: "Substâncias não biodegradáveis acumulam-se em maiores teores nos predadores do topo da cadeia trófica."
    }
  ],
  anatomy: [
    {
      text: "Em qual câmara do coração humano tem início a grande circulação (circulação sistêmica)?",
      options: ["Átrio direito", "Ventrículo esquerdo", "Ventrículo direito", "Átrio esquerdo"],
      answer: 1,
      explanation: "O ventrículo esquerdo impulsiona o sangue oxigenado pela artéria aorta para todos os tecidos do corpo humano."
    },
    {
      text: "Qual hormônio produzido pelas células beta do pâncreas facilita a entrada de glicose nas células, reduzindo a glicemia?",
      options: ["Glucagon", "Insulina", "Adrenalina", "Tiroxina"],
      answer: 1,
      explanation: "A insulina promove a captação de glicose celular e a síntese de glicogênio no fígado e músculos."
    },
    {
      text: "A unidade funcional e estrutural do rim responsável pela filtração do sangue e formação da urina é o:",
      options: ["Neurônio", "Néfron", "Alvéolo", "Hepatócito"],
      answer: 1,
      explanation: "Cada rim possui cerca de um milhão de néfrons, formados pelo glomérulo e sistema de túbulos renais."
    }
  ],
  botany: [
    {
      text: "Qual dos seguintes grupos vegetais foi o primeiro a apresentar vasos condutores de seiva (traqueófitas)?",
      options: ["Briófitas", "Pteridófitas", "Gimnospermas", "Angiospermas"],
      answer: 1,
      explanation: "As pteridófitas (como as samambaias) são as primeiras plantas vasculares, embora ainda não produzam sementes."
    },
    {
      text: "A presença de flores coloridas, nectários e frutos verdadeiros protegendo as sementes é exclusiva de:",
      options: ["Gimnospermas", "Angiospermas", "Briófitas", "Algas"],
      answer: 1,
      explanation: "As angiospermas desenvolveram flores para atração de polinizadores e frutos que auxiliam na dispersão."
    },
    {
      text: "O tecido vegetal responsável pelo transporte da seiva inorgânica (água e sais minerais) da raiz às folhas é o:",
      options: ["Floema", "Xilema", "Parênquima", "Colênquima"],
      answer: 1,
      explanation: "O xilema (lenho) conduz a seiva bruta das raízes para a copa sob tensão de transpiração."
    }
  ],
  microbiology: [
    {
      text: "Qual das seguintes características distingue fundamentalmente os vírus de todos os outros organismos vivos?",
      options: ["Possuem parede de celulose", "São parasitas intracelulares obrigatórios acelulares", "Têm núcleo duplo", "Reproduzem-se por mitose"],
      answer: 1,
      explanation: "Os vírus não possuem estrutura celular nem metabolismo próprio fora de uma célula hospedeira."
    },
    {
      text: "O uso indiscriminado e inadequado de antibióticos promove nos ambientes clínicos:",
      options: ["Criação de novos vírus", "Seleção de bactérias resistentes", "Imunidade permanente humana", "Esterilização total"],
      answer: 1,
      explanation: "O antibiótico atua como agente seletivo, eliminando cepas sensíveis e favorecendo linhagens bacterianas resistentes."
    }
  ],
  biochemistry: [
    {
      text: "As enzimas aceleram as reações químicas celulares principalmente por:",
      options: ["Aumentar a temperatura do sistema", "Diminuir a energia de ativação da reação", "Consumir reagentes adicionais", "Mudar o pH celular"],
      answer: 1,
      explanation: "Enzimas são catalisadores biológicos proteicos que reduzem a energia de ativação necessária para a reação ocorrer."
    },
    {
      text: "Qual polissacarídeo atua como a principal reserva energética em animais e fungos?",
      options: ["Amido", "Glicogênio", "Celulose", "Quitina"],
      answer: 1,
      explanation: "O glicogênio é armazenado principalmente no fígado e nas fibras musculares estriadas esqueléticas."
    }
  ]
};

export function getFallbackQuestions(topic, count = 3) {
  const norm = String(topic || '').toLowerCase();
  let key = 'cytology';
  if (/gen[eé]t|dna|rna|hered|mendel/i.test(norm)) key = 'genetics';
  else if (/ecol|bioma|sustent|cadeia|rela/i.test(norm)) key = 'ecology';
  else if (/anat|fisiol|cora|digest|resp|rim/i.test(norm)) key = 'anatomy';
  else if (/bot[aâ]n|plant|veget|folha|foto/i.test(norm)) key = 'botany';
  else if (/micro|bact|v[ií]rus|fungo/i.test(norm)) key = 'microbiology';
  else if (/bioq|enzim|prot|atp|glic/i.test(norm)) key = 'biochemistry';

  const pool = BIOLOGY_QUESTION_BANK[key] || BIOLOGY_QUESTION_BANK.cytology;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // If fewer than count, complete with cytology questions
  if (selected.length < count) {
    for (const q of BIOLOGY_QUESTION_BANK.cytology) {
      if (selected.length >= count) break;
      if (!selected.some((s) => s.text === q.text)) selected.push(q);
    }
  }

  return selected.slice(0, count).map((q) => ({
    text: q.text,
    options: [...q.options],
    answer: q.answer,
    explanation: q.explanation,
  }));
}

export function getBioBotFallbackReply(question) {
  const q = String(question || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/mitocondria|atp|respiracao|energia/i.test(q)) {
    return 'A mitocôndria é como a "usina de força" da célula! Ela pega os nutrientes da digestão e o oxigênio pra gerar ATP, que é a energia pra tudo no seu corpo funcionar.';
  }
  if (/fotossintese|cloroplast|clorofila|planta/i.test(q)) {
    return 'A fotossíntese é como as plantas fabricam seu próprio alimento! Usando a luz do Sol, água e CO2 do ar, elas produzem glicose e liberam o oxigênio que a gente respira.';
  }
  if (/dna|rna|gene|mutacao|genetica|mendel/i.test(q)) {
    return 'O DNA é o grande livro de receitas da vida! Cada pedaço dele é um gene com instruções pra produzir proteínas e definir todas as nossas características.';
  }
  if (/virus|bacteria|vacina|imunidade/i.test(q)) {
    return 'Os vírus são parasitas intracelulares: precisam invadir uma célula pra se reproduzir! A vacina treina nossos glóbulos brancos e anticorpos pra vencê-los antes que façam estrago.';
  }
  if (/membrana|osmose|difusao/i.test(q)) {
    return 'A membrana plasmática funciona como a portaria da célula, com permeabilidade seletiva! Na osmose, a água se move de onde tem menos soluto para onde tem mais, buscando equilibrar a concentração.';
  }
  if (/coracao|sangue|pulmao|circulatorio/i.test(q)) {
    return 'O coração é a bomba motora do corpo! Ele recebe sangue rico em oxigênio vindo dos pulmões e dispara com pressão pelas artérias pra abastecer cada órgão.';
  }
  if (/celula|organela|ribossomo/i.test(q)) {
    return 'A célula é o tijolinho básico de qualquer ser vivo! Os ribossomos montam as proteínas, o complexo de Golgi empacota e a mitocôndria dá energia pra essa mini-cidade funcionar.';
  }

  return 'Excelente pergunta de Biologia! A vida funciona conectando células, metabolismo e equilíbrio ecológico. Me conta: você quer aprofundar em Citologia, Genética ou Ecologia agora?';
}
