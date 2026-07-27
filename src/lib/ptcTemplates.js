/**
 * Biblioteca de templates de texto da PTC — Proposta Técnica Comercial.
 *
 * Espelha ptc_templates.json / schema_v7_ptc_templates.sql (tabelas
 * ptc_tipo_servico, ptc_sequencia_etapa, ptc_item_catalogo, ptc_bloco_fixo).
 * Enquanto a migração do Supabase não estiver aplicada, esta é a fonte que
 * alimenta o gerador; as estruturas usam os mesmos nomes de campo das tabelas,
 * então trocar por dados do banco depois é substituir a origem dos objetos.
 *
 * Modelo: cada PTC = blocos fixos (iguais em todas, só interpolam placeholders)
 * + blocos por tipo de serviço + orçamento (dados da proposta).
 *
 * Nota: o corpo técnico segue a decisão do cliente de não publicar o contato do
 * Matheus Peiker em propostas e relatórios — por isso ele não consta aqui,
 * embora apareça no JSON de origem.
 */

export const EMPRESA_PTC = {
  razao_social: 'Engeplar Indústria e Comércio Ltda.',
  endereco: 'Rua Amazonas, 475. Bairro Cruzeiro - CEP 89121-000 - Rio dos Cedros - SC',
  fone: '(47) 3386-0000',
  corpo_tecnico: [
    { nome: 'John Clovis Peiker', cargo: 'Diretor Técnico', email: 'john@engeplar.com.br', celular: '(47) 9 8815-3943' },
    { nome: 'Edson James Peiker', cargo: 'Diretor', email: 'james@engeplar.com.br', celular: '(47) 9 8829-3476' },
  ],
  assinatura_rodape: 'A Engeplar conta com uma equipe de técnicos, que trabalham em conjunto para complementar as especialidades de projeto e consultoria, bem como uma série de empresas associadas que atuam na execução e em serviços especiais de Engenharia.',
  despedida: 'Atenciosamente e pronto para atendê-los a qualquer momento,',
};

/**
 * Ordem canônica das seções. A numeração NÃO é fixa: é gerada na ordem das
 * seções ativas (ver `numerada`), porque ela varia entre os documentos
 * históricos. `capa`, `tabela_revisoes` e `saudacao` não recebem número.
 */
export const ESTRUTURA_PADRAO = [
  { chave: 'capa',                        titulo: 'CAPA',                                  numerada: false },
  { chave: 'tabela_revisoes',             titulo: 'HISTÓRICO DE REVISÕES',                 numerada: false },
  { chave: 'saudacao',                    titulo: 'SAUDAÇÃO / DESTINATÁRIO',               numerada: false },
  { chave: 'objetivo',                    titulo: 'OBJETIVO',                              numerada: true },
  { chave: 'dimensao_estrutura',          titulo: 'INFORMAÇÕES / DIMENSÃO DA ESTRUTURA',   numerada: true },
  { chave: 'sequencia_execucao',          titulo: 'SEQUÊNCIA DE EXECUÇÃO',                 numerada: true },
  { chave: 'prazo_execucao',              titulo: 'PRAZO DE EXECUÇÃO',                     numerada: true },
  { chave: 'garantia',                    titulo: 'GARANTIA',                              numerada: true },
  { chave: 'responsabilidades_contratada', titulo: 'RESPONSABILIDADES DA CONTRATADA',      numerada: true },
  { chave: 'responsabilidade_contratante', titulo: 'RESPONSABILIDADE DO CONTRATANTE',      numerada: true },
  { chave: 'observacoes_rigido',          titulo: 'OBSERVAÇÕES IMPORTANTES',               numerada: true },
  { chave: 'valor_investimento',          titulo: 'VALOR DO INVESTIMENTO',                 numerada: true },
  { chave: 'notas',                       titulo: 'NOTAS',                                 numerada: true },
  { chave: 'condicoes_gerais',            titulo: 'CONDIÇÕES GERAIS',                      numerada: true },
  { chave: 'contatos',                    titulo: 'CONTATOS E CORPO TÉCNICO',              numerada: true },
];

export const BLOCOS_FIXOS = {
  saudacao: '{{cidade_data}}\nA {{cliente_nome}}{{#cliente_unidade}} — UNIDADE: {{cliente_unidade}}{{/cliente_unidade}}\nOBRA: {{obra_nome}}\nFONE: {{cliente_fone}}   CELULAR: {{cliente_celular}}\nE-mail: {{cliente_email}}\n\nAt. {{contato_nome}}.\nPrezado Senhor,\nConforme entendimentos mantidos, apresentamos PROPOSTA TÉCNICA COMERCIAL para execução dos serviços em referência, como segue:',

  garantia: 'Os serviços realizados conforme especificação têm a garantia de {{garantia_meses}} meses a partir da conclusão dos trabalhos.\nEsta garantia prevê somente a reposição das condições originais das áreas que sofreram intervenção. Estão excluídos desta garantia danos provenientes de fenômenos estranhos às condições conhecidas de uso considerados como normais.\nCaso seja identificada alguma anomalia, esta deve ser comunicada para executarmos os devidos reparos e/ou análise das eventuais anomalias.',

  prazo_execucao: 'Estimamos executar os serviços em {{prazo_dias}} dias, considerando trabalhos em {{regime_trabalho}}.\nEsse prazo pode sofrer alterações em função das condições climáticas e das liberações das áreas pelo contratante.',

  observacoes_rigido: 'Por se tratar de um sistema de proteção de comportamento rígido, caso a estrutura apresente deformações e/ou surjam fissuras expressivas, podem ocorrer rupturas na camada de proteção aplicada — o sistema protetivo perde localmente sua capacidade de proteção e, consequentemente, sua estanqueidade. Portanto, a estrutura deve atender aos parâmetros e requisitos de desempenho definidos pela norma brasileira de projetos de estruturas de concreto armado e protendido NBR 6118 (ABNT, 2023). Entende-se que devam ser seguidas as orientações e os procedimentos executivos definidos nas normas de impermeabilização e proteção de estruturas NBR 9574 (ABNT, 2008) e NBR 9575 (ABNT, 2006).',

  responsabilidades_contratada: [
    'Mão de obra especializada para a execução dos serviços em referência;',
    'Limpeza mecânica de toda área que receberá a intervenção;',
    'Material para a execução da obra;',
    'Fornecimento de ART (Anotação de Responsabilidade Técnica);',
    'Fornecimento de relatório fotográfico e executivo;',
    'Ferramentas e equipamentos de aplicação necessários para o serviço;',
    'Estadia dos profissionais envolvidos na obra;',
    'Equipe composta por supervisor/auxiliar/aplicador;',
    'Deslocamento de toda equipe, materiais e equipamentos envolvidos nos trabalhos.',
  ],

  responsabilidade_contratante: [
    'Local para depósito de resíduos da obra e destinação final;',
    'Programar com antecedência mínima de 15 dias para início da obra;',
    'Condições de realizar o serviço de forma adequada e favorável aos aplicadores;',
    'Liberação da área que sofrerá as intervenções, limpa e sem interferências;',
    'Fornecer local coberto e fechado para guarda de materiais de aplicação;',
    'Fornecer energia elétrica monofásica e trifásica com capacidade de 85A independente, distância máxima de 15mt;',
    'Fornecer água potável com capacidade de 30lt por minuto, distância máxima de 20mt;',
    'Fornecer sanitários e vestiários para nossos colaboradores.',
  ],

  notas: [
    'Não está sendo contemplado nenhum trabalho de desmontagem mecânica, elétrica ou hidráulica;',
    'Os preços orçados são para execução da obra numa única etapa, considerando uma única mobilização;',
    'Nomear e apresentar responsável pelo acompanhamento dos trabalhos, trâmite de informações entre contratada/contratante e assinatura de boletim comprobatório diário;',
    'O contrato deverá ser assinado antes do início dos serviços. O contrato terá validade de 6 meses. O reajuste será anual, onde os valores permanecem para outras unidades, tendo apenas alteração no item de mobilização;',
    'As condições acima descritas poderão ser alteradas após acordo entre as partes e renegociação de valores.',
  ],

  condicoes_gerais: {
    empreitada: 'Prazo de início: {{inicio_obs}}\nPrazo de pagamento: {{pagamento_dias}} dias da entrega.\nFrete: {{frete}} – Obra.',
    diaria: 'Condições de pagamento: {{pagamento_dias}} dias.\nValidade da proposta: {{validade_dias}} dias.\nFrete: {{frete}}.\nMobilização: {{mobilizacao_obs}}.',
  },
};

export const TIPOS_SERVICO = [
  {
    codigo: 'REVEST_PRFV',
    nome: 'Revestimento impermeabilizante anticorrosivo com PRFV',
    aliases: ['revestimento com prfv', 'bacia de contenção prfv', 'tanque prfv', 'liner prfv'],
    regime: 'empreitada_global',
    garantia_meses: 36,
    unidade_padrao: 'm2',
    usa_observacoes_rigido: false,
    objetivo: 'Serviço de preparação da base cimentícia para receber o revestimento impermeabilizante anticorrosivo com PRFV — Polímero Reforçado com Fibra de Vidro — no fundo e paredes da estrutura.\nPelo regime de empreitada, incluindo o fornecimento de mão de obra especializada, material técnico necessário e ferramentas para a completa realização das atividades.',
    sequencia_execucao: [
      { etapa: 'LIMPEZA', texto: 'Será executado sistema de limpeza abrasiva de toda a estrutura que receberá o sistema de impermeabilização anticorrosiva.' },
      { etapa: 'PRIMER', texto: 'Após a preparação da base de concreto armado, o substrato estará em condições de receber o revestimento. Será aplicado o primer AT/primer para garantir aderência mínima entre base e revestimento protetivo.' },
      { etapa: 'CAMADA DE REFORÇO COM PRFV', texto: 'Concluída a aplicação do primer, será aplicado revestimento com PRFV, com 2,0 a 4,0mm de espessura em toda a estrutura interna.' },
      { etapa: 'CAMADA FINAL', texto: 'Para aferição do revestimento e acompanhamento do desgaste e deformação térmica, será aplicada camada simples de véu sintético. Pintura com resina e escama de vidro, pigmentado, garantindo maior vida útil contra abrasão, corrosão e ataques químicos.' },
      { etapa: 'ACABAMENTO', texto: 'Após verificação de possíveis imperfeições, será feita inspeção visual.' },
    ],
    especificacoes_tecnicas: {
      'Espessura final': '2,0 a 4,0mm',
      'Resina': 'Isoftálica / Éster-Vinílica',
      'Catálise': 'Sistema de catálise química',
    },
    itens_catalogo: [
      { descricao: 'Limpeza mecânica abrasiva da área que receberá a intervenção corretiva/protetiva', unidade: 'm2', valor_ref: 42.66 },
      { descricao: 'Execução de nova camada de piso de concreto com 0,12m de espessura', unidade: 'm2', valor_ref: 348.13 },
      { descricao: 'Recuperação das manifestações patológicas', unidade: 'm2', valor_ref: 628.80 },
      { descricao: 'Aplicação do primer para superfície úmida', unidade: 'm2', valor_ref: 121.90 },
      { descricao: 'Revestimento impermeabilizante com PRFV, estrutural, com espessura média', unidade: 'm2', valor_ref: 396.69 },
      { descricao: 'Mobilização da equipe e equipamentos', unidade: 'evento', valor_ref: 2500.00 },
    ],
  },

  {
    codigo: 'PISO_URETANO',
    nome: 'Revestimento de piso autonivelante / argamassado uretano',
    aliases: ['autonivelante uretano', 'argamassado uretano', 'piso industrial uretano', 'rodapé sanitário'],
    regime: 'empreitada_global',
    garantia_meses: 60,
    unidade_padrao: 'm2',
    usa_observacoes_rigido: true,
    objetivo: 'Serviço de preparação da base de concreto, correção de caimento para o ralo, aplicação do sistema de revestimento impermeabilizante protetivo com autonivelante uretano e revestimento das muretas e rodapé sanitário.',
    sequencia_execucao: [
      { etapa: 'LIMPEZA', texto: 'Será executada a limpeza de toda a área que sofrerá a intervenção com sistema de polimento abrasivo, garantindo que o substrato esteja limpo e livre de contaminação que possa prejudicar a visualização de possíveis patologias a serem reparadas.' },
      { etapa: 'CORREÇÃO DE CAIMENTO', texto: 'Após a preparação da base, será executada a correção de caimento para o ralo, elevando o nível frente à porta.' },
      { etapa: 'REVESTIMENTO AUTONIVELANTE', texto: 'Após a preparação da base e limpeza, será aplicado o revestimento autonivelante em toda a área de piso.' },
      { etapa: 'RODAPÉ / MURETAS', texto: 'Será aplicado o revestimento sanitário no rodapé com desenvolvimento de 100mm e revestimento total das muretas.' },
    ],
    especificacoes_tecnicas: {
      'Consumo do autonivelante': '9,14 kg/m²',
      'Desenvolvimento do rodapé': '100mm',
    },
    itens_catalogo: [
      { descricao: 'Mobilização/Desmobilização de equipamento', unidade: 'evento', valor_ref: 1500.00 },
      { descricao: 'Limpeza com hidrojateamento de média pressão e/ou limpeza mecânica abrasiva', unidade: 'm2', valor_ref: 12.60 },
      { descricao: 'Correção de caimento para o ralo', unidade: 'evento', valor_ref: 2050.00 },
      { descricao: 'Aplicação do revestimento autonivelante AN (consumo conforme especificação)', unidade: 'm2', valor_ref: 42.50 },
      { descricao: 'Aplicação do revestimento argamassado arredondado nos rodapés (100mm) e revestimento das muretas', unidade: 'm', valor_ref: 268.30 },
    ],
  },

  {
    codigo: 'SOLDA_TERMOFUSAO',
    nome: 'Diária de solda plástica por termofusão',
    aliases: ['solda plástica', 'termofusão', 'solda pp', 'solda pead', 'manutenção de solda'],
    regime: 'diaria',
    garantia_meses: null,
    unidade_padrao: 'diaria',
    usa_observacoes_rigido: false,
    objetivo: 'Prestação de serviço de solda plástica por termofusão em equipamento fabricado com material termoplástico (Polipropileno / PEAD).',
    sequencia_execucao: [],
    prazo_execucao_override: 'Esta proposta é regida pelo regime de diária de trabalho, contemplando equipe, equipamentos de solda plástica e material de solda para os reparos necessários.\nNão estão contemplados neste escopo: peças, equipamentos, movimentação de materiais e equipamentos de acesso a locais que demandem equipamentos específicos.',
    notas_override: [
      'Caso, por solicitação da contratante, o equipamento e/ou equipe permaneça no canteiro sem uso ou ocioso, será cobrada diária improdutiva de referência ou tempo proporcional;',
      'O prazo de entrega pode sofrer alteração dependendo das condições climáticas.',
    ],
    itens_catalogo: [
      { descricao: 'Meia diária de reparo — Polipropileno (PP)', unidade: 'evento', valor_ref: 1750.00 },
      { descricao: 'Diária de equipe/equipamento (referência — inclui hora improdutiva)', unidade: 'diaria', valor_ref: 2800.00 },
      { descricao: 'Mobilização/Desmobilização de equipe e equipamento', unidade: 'evento', valor_ref: null },
    ],
  },

  {
    codigo: 'INJECAO_QUIMICA',
    nome: 'Impermeabilização por injeção química estrutural',
    aliases: ['injeção química', 'resina estrutural', 'resina hidroexpansiva', 'impermeabilização pontual'],
    regime: 'medicao',
    garantia_meses: null,
    unidade_padrao: 'medicao',
    usa_observacoes_rigido: false,
    objetivo: 'Execução do sistema de impermeabilização e solidificação com injeção química nos pontos de interface, devolvendo a estabilidade estrutural e a impermeabilidade.\nSistema estrutural flexível de impermeabilização pontual, mantendo as movimentações estruturais definidas pela estrutura de concreto armado/metálica, a estanqueidade, a proteção das armaduras e a integridade estrutural.\nProposta regida pelo regime de empreitada global, considerando consumo de material, equipe técnica e ferramentas necessárias.',
    sequencia_execucao: [
      { etapa: 'LIMPEZA', texto: 'Limpeza de toda a área até encontrar concreto são e remoção de material solto.' },
      { etapa: 'DEMARCAÇÃO', texto: 'Demarcar os pontos para a instalação dos bicos de injeção.' },
      { etapa: 'INSTALAÇÃO DE VÁLVULAS', texto: 'Instalação das válvulas de retenção definidas e preparação dos pontos que antecedem a injeção.' },
      { etapa: 'INJEÇÃO', texto: 'Injeção química das resinas apontadas e aguardo da cura.' },
      { etapa: 'ACABAMENTO', texto: 'Retirada das válvulas de retenção (bicos), reparo dos pontos e limpeza final.' },
    ],
    observacao_especifica: 'Por se tratar de sistema de impermeabilização pontual, executado através da pressurização e injeção de resinas químicas nos pontos com infiltração, este sistema é complementar e/ou de emergência para estanqueidade e proteção pontual, podendo ser necessárias intervenções posteriores.',
    condicoes_pagamento_override: 'Os serviços serão pagos por medições proporcionais à execução (medição mensal/quinzenal), com pagamento em 15 dias após a medição. Atraso nos pagamentos das medições acarretará multa diária de 0,5% sobre o valor da medição e suspensão imediata dos serviços.',
    itens_catalogo: [
      { descricao: 'Resina hidroexpansiva estrutural', unidade: 'lts', valor_ref: 344.00 },
      { descricao: 'Resina flexível', unidade: 'lts', valor_ref: 195.00 },
      { descricao: 'Material de reparo sobre o local de instalação dos bicos', unidade: 'kg', valor_ref: 12.50 },
      { descricao: 'Válvulas de retenção', unidade: 'pç', valor_ref: 16.50 },
      { descricao: 'Solvente de limpeza especial', unidade: 'lts', valor_ref: 92.00 },
      { descricao: 'Diária de equipe e equipamentos', unidade: 'diaria', valor_ref: 3100.00 },
      { descricao: 'Mobilização/Desmobilização de equipe e equipamentos', unidade: 'evento', valor_ref: 800.00 },
    ],
  },

  {
    codigo: 'MEMBRANA_PVC',
    nome: 'Revestimento impermeabilizante com manta/membrana de PVC (sistema não aderido)',
    aliases: ['manta de pvc', 'membrana pvc', 'membrana não aderida', 'reservatório manta pvc'],
    regime: 'empreitada_global',
    garantia_meses: 60,
    unidade_padrao: 'm2',
    usa_observacoes_rigido: false,
    objetivo: 'Serviço de preparação da base de concreto armado para receber o sistema de impermeabilização com aplicação de membrana de PVC não aderida à base de concreto — sistema que facilita a higienização e manutenção.\nO MTD (Memorial Técnico Descritivo) do fabricante faz parte integrante desta proposta.\nProposta regida pelo regime de empreitada global, incluindo mão de obra especializada, materiais e ferramentas.',
    sequencia_execucao: [
      { etapa: 'PAREDES, VIGA E FUNDO', texto: 'Preparação da área que receberá a intervenção com sistema de limpeza mecânica abrasiva. Instalação do sistema de impermeabilização com manta de PVC, conforme procedimento técnico apontado pelo fabricante e fornecedor do sistema.' },
    ],
    itens_catalogo: [
      { descricao: 'Limpeza mecânica abrasiva da área que receberá a intervenção', unidade: 'm2', valor_ref: 45.00 },
      { descricao: 'Recuperação das manifestações patológicas estruturais leves', unidade: 'm2', valor_ref: 59.00 },
      { descricao: 'Recuperação das manifestações patológicas com armadura aparente', unidade: 'm2', valor_ref: 320.00 },
      { descricao: 'Instalação da impermeabilização com manta de PVC', unidade: 'm2', valor_ref: 225.00 },
      { descricao: 'Mobilização/Desmobilização de equipamento', unidade: 'evento', valor_ref: 13500.00 },
      { descricao: 'ART + Laudo de estanqueidade', unidade: 'evento', valor_ref: 1300.00 },
      { descricao: 'Pintura externa da estrutura', unidade: 'm2', valor_ref: 81.00 },
    ],
  },

  {
    codigo: 'HIDROJATO_PINTURA',
    nome: 'Limpeza por hidrojateamento e pintura estética protetiva',
    aliases: ['hidrojateamento', 'pintura protetiva', 'pintura estética', 'repintura de tanques', 'limpeza de média pressão'],
    regime: 'diaria',
    garantia_meses: null,
    unidade_padrao: 'diaria',
    usa_observacoes_rigido: false,
    objetivo: 'Serviço de limpeza por hidrojateamento de média pressão nas paredes e cobertura interna, seguido da aplicação do sistema de pintura estética protetiva.\nProposta regida pelo regime de diária de trabalho.',
    sequencia_execucao: [],
    prazo_execucao_override: 'Estimamos executar os trabalhos de limpeza por hidrojateamento de todo o escopo apontado em {{prazo_dias}} dias consecutivos, podendo sofrer alterações dependendo das liberações e/ou paralisações. A pintura só terá prazo apontado após a conclusão da limpeza, devido às condições finais.',
    itens_catalogo: [
      { descricao: 'Serviço de limpeza por hidrojateamento de média pressão', unidade: 'diaria', valor_ref: 3950.00 },
      { descricao: 'Serviço de aplicação de pintura estética protetiva com sistema pneumático airless', unidade: 'diaria', valor_ref: 3750.00 },
      { descricao: 'Mobilização/Desmobilização de equipamento', unidade: 'evento', valor_ref: 3800.00 },
    ],
  },

  {
    codigo: 'CRISTALIZANTE',
    nome: 'Revestimento impermeabilizante com cristalização de concreto',
    aliases: ['cristalizante', 'cristalização de concreto', 'impermeabilização por cristalizante', 'recuperação de manifestações patológicas'],
    regime: 'empreitada_global',
    garantia_meses: 60,
    unidade_padrao: 'm2',
    usa_observacoes_rigido: true,
    objetivo: 'Serviço de preparação da base de concreto com limpeza abrasiva de média pressão, recuperação das manifestações patológicas e aplicação do sistema de impermeabilização por cristalizante de concreto por ação química (aplicação única e definitiva).\nProposta regida pelo regime de empreitada global.',
    sequencia_execucao: [
      { etapa: 'LIMPEZA', texto: 'Limpeza de toda a estrutura com sistema de hidrojateamento de média pressão (5.000 PSI) e/ou lixamento abrasivo, garantindo substrato limpo e livre de contaminação.' },
      { etapa: 'REVESTIMENTO IMPERMEABILIZANTE', texto: 'Aplicação do impermeabilizante anticorrosivo por migração e cristalização química, com resistência a alterações de pH em contato direto de 4 a 10, consumo indicado de 1,5 kg/m² (respeitar para a eficiência do sistema).' },
      { etapa: 'RECUPERAÇÃO DAS MANIFESTAÇÕES PATOLÓGICAS', texto: 'Tratamento de corrosão de armadura, trincas, fissuras e juntas de concretagem, com incremento de cobrimento da ferragem onde necessário.' },
    ],
    especificacoes_tecnicas: {
      'Consumo': '1,5 kg/m²',
      'Resistência a pH': '4 a 10',
    },
    itens_catalogo: [
      { descricao: 'Limpeza e preparação da base cimentícia com hidrojateamento abrasivo', unidade: 'm2', valor_ref: 32.47 },
      { descricao: 'Recuperação das manifestações patológicas com reforço estrutural (ferragem, cobrimento 4cm)', unidade: 'm', valor_ref: 657.00 },
      { descricao: 'Impermeabilização com cristalizante de concreto por projeção (consumo 1,5 kg/m²)', unidade: 'm2', valor_ref: 231.00 },
      { descricao: 'Revestimento com membrana de poliuretano moldada in loco', unidade: 'm2', valor_ref: 432.00 },
      { descricao: 'Mobilização da equipe e equipamentos', unidade: 'evento', valor_ref: 2500.00 },
    ],
  },

  {
    codigo: 'MEMBRANA_POLIURETANO',
    nome: 'Revestimento impermeabilizante com membrana de poliuretano estruturado (MASTERPOL)',
    aliases: ['masterpol', 'membrana de poliuretano', 'poliuretano estruturado', 'manta de poliuretano moldada'],
    regime: 'empreitada_global',
    garantia_meses: 60,
    unidade_padrao: 'm2',
    usa_observacoes_rigido: false,
    template_base: 'MEMBRANA_PVC',
    refinar: 'Tipo identificado por título (PTC-0311, 0316, 0354). Herda estrutura de MEMBRANA_PVC; refinar objetivo/itens com leitura dedicada antes de usar em produção.',
    objetivo: 'Serviço de preparação da base para receber o sistema de impermeabilização com membrana de poliuretano estruturado moldada in loco.',
    sequencia_execucao: [],
    itens_catalogo: [],
  },

  {
    codigo: 'MANTA_ASFALTICA',
    nome: 'Impermeabilização semiflexível e manta asfáltica',
    aliases: ['manta asfáltica', 'impermeabilização semiflexível', 'obra residencial'],
    regime: 'empreitada_global',
    garantia_meses: 60,
    unidade_padrao: 'm2',
    usa_observacoes_rigido: false,
    template_base: 'MEMBRANA_PVC',
    refinar: 'Tipo identificado por título (PTC-0326, 0330 — VS Engenharia). Herda estrutura de empreitada; refinar objetivo/sequência/itens com leitura dedicada antes de usar em produção.',
    objetivo: 'Serviço de impermeabilização com argamassa polimérica semiflexível e/ou manta asfáltica nas áreas indicadas.',
    sequencia_execucao: [],
    itens_catalogo: [],
  },

  {
    codigo: 'PISO_CIMENTICIO',
    nome: 'Revestimento de piso argamassado/autonivelante cimentício (CR90)',
    aliases: ['argamassado cimentício', 'autonivelante cimentício', 'cr90', 'revestimento de piso cimentício'],
    regime: 'empreitada_global',
    garantia_meses: 60,
    unidade_padrao: 'm2',
    usa_observacoes_rigido: true,
    template_base: 'PISO_URETANO',
    refinar: 'Tipo recorrente (PTC-0195 Luiz Volpato, PTC-0308 Hahne, PTC-0315 Hahne). Mesma estrutura do piso uretano, porém material cimentício (argamassado CR90 / autonivelante cimentício). Refinar objetivo/itens com leitura dedicada de uma PTC cimentícia antes de produção.',
    objetivo: 'Serviço de preparação da base de concreto e aplicação do sistema de revestimento de piso industrial com argamassado/autonivelante cimentício (CR90), incluindo correção de nível/caimento onde necessário.',
    sequencia_execucao: [],
    itens_catalogo: [],
  },
];

/** Rótulos legíveis dos regimes. */
export const REGIMES = {
  empreitada_global: 'empreitada global',
  diaria: 'diária de trabalho',
  medicao: 'medição',
};

/** Lista para popular o seletor de tipo de serviço no formulário. */
export function listarTiposServico() {
  return TIPOS_SERVICO.map(t => ({ codigo: t.codigo, nome: t.nome, regime: t.regime }));
}

/**
 * Tipo de serviço com herança resolvida: campos vazios de um tipo marcado com
 * `template_base` são preenchidos pelo tipo-base (sequência e itens).
 */
export function getTipoServico(codigo) {
  const tipo = TIPOS_SERVICO.find(t => t.codigo === codigo);
  if (!tipo) return null;
  if (!tipo.template_base) return tipo;

  const base = TIPOS_SERVICO.find(t => t.codigo === tipo.template_base);
  if (!base) return tipo;
  return {
    ...tipo,
    sequencia_execucao: tipo.sequencia_execucao?.length ? tipo.sequencia_execucao : base.sequencia_execucao,
    itens_catalogo: tipo.itens_catalogo?.length ? tipo.itens_catalogo : base.itens_catalogo,
    especificacoes_tecnicas: tipo.especificacoes_tecnicas || base.especificacoes_tecnicas,
  };
}

/** Sugere o tipo a partir de um texto livre (assunto/descrição), via aliases. */
export function sugerirTipoServico(texto) {
  const t = String(texto || '').toLowerCase();
  if (!t.trim()) return null;
  for (const tipo of TIPOS_SERVICO) {
    if (tipo.nome.toLowerCase().split(/\s+/).every(p => p.length < 4 || t.includes(p))) return tipo.codigo;
    if ((tipo.aliases || []).some(a => t.includes(a.toLowerCase()))) return tipo.codigo;
  }
  return null;
}

/**
 * Interpolador dos blocos fixos. Suporta {{campo}} e o bloco condicional
 * {{#campo}}...{{/campo}}, que só aparece quando o campo tem valor.
 */
export function interpolar(texto, vars = {}) {
  if (!texto) return '';
  return String(texto)
    .replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, chave, corpo) => {
      const v = vars[chave];
      return v == null || v === '' ? '' : corpo;
    })
    .replace(/\{\{(\w+)\}\}/g, (_, chave) => {
      const v = vars[chave];
      return v == null || v === '' ? '______' : String(v);
    });
}
