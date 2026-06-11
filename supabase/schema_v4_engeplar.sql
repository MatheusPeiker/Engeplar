-- =============================================================
--  SISTEMA ENGENHARIA — Schema v4: Módulo PTC / RVT Engeplar
--  Cole este arquivo no SQL Editor do Supabase e execute tudo.
-- =============================================================

-- ── Tipos de Serviço ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_servico (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome                TEXT NOT NULL DEFAULT '',
  texto_objetivo      TEXT DEFAULT '',
  texto_observacoes   TEXT DEFAULT '',
  texto_descricao_rte TEXT DEFAULT '',
  sequencia_padrao    JSONB DEFAULT '[]',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tipos_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tipos_servico_user_policy" ON tipos_servico
  USING (auth.uid() = user_id);

-- ── PTC — Proposta Técnica Comercial ─────────────────────────
CREATE TABLE IF NOT EXISTS ptc (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  obra_id             UUID REFERENCES obras(id) ON DELETE SET NULL,
  tipo_servico_id     UUID REFERENCES tipos_servico(id) ON DELETE SET NULL,

  -- Identificação
  numero              TEXT DEFAULT '',
  numero_completo     TEXT DEFAULT '',
  revisao             INTEGER DEFAULT 0,
  data_emissao        DATE DEFAULT CURRENT_DATE,
  status              TEXT DEFAULT 'rascunho',   -- rascunho | emitido

  -- Cliente
  cliente_nome        TEXT DEFAULT '',
  cliente_cnpj        TEXT DEFAULT '',
  cliente_endereco    TEXT DEFAULT '',
  cliente_cidade      TEXT DEFAULT '',
  cliente_estado      TEXT DEFAULT '',
  cliente_fone        TEXT DEFAULT '',
  cliente_email       TEXT DEFAULT '',
  cliente_contato_nome TEXT DEFAULT '',
  cliente_unidade     TEXT DEFAULT '',

  -- Capa
  descricao_servico   TEXT DEFAULT '',
  subtitulo_servico   TEXT DEFAULT '',
  area_total          TEXT DEFAULT '',

  -- Tabela de revisões (exibida na capa e na pág. 2)
  -- [{rev, data, descricao, elaboracao, visita, solicitante}]
  revisoes            JSONB DEFAULT '[]',
  elaboracao_nome     TEXT DEFAULT '',
  elaboracao_data     TEXT DEFAULT '',
  visita_nome         TEXT DEFAULT '',
  solicitante_nome    TEXT DEFAULT '',
  solicitante_data    TEXT DEFAULT '',

  -- Seção 1 — Objetivo
  texto_objetivo      TEXT DEFAULT '',

  -- Seção 3 — Prazo
  prazo_dias          INTEGER DEFAULT 5,
  regime_trabalho     TEXT DEFAULT 'regime extraordinário',

  -- Seção 4 — Sequência de execução
  -- [{numero: "4.1", texto: "..."}]
  sequencia_execucao  JSONB DEFAULT '[]',

  -- Seção 7 — Notas
  num_mobilizacoes    INTEGER DEFAULT 1,

  -- Seção 8 — Condições gerais
  frete_material      TEXT DEFAULT 'CIF – Obra',
  frete_mao_obra      TEXT DEFAULT 'CIF – Obra',
  condicoes_pagamento TEXT DEFAULT '14 dias da emissão da nota',

  -- Seção 9 — Observações importantes
  texto_observacoes   TEXT DEFAULT '',

  -- Seção 10 — Preços
  -- [{item, descricao, unidade, qtd, valor_unit}]
  itens_materiais     JSONB DEFAULT '[]',
  itens_servicos      JSONB DEFAULT '[]',
  frete_valor         NUMERIC DEFAULT 0,
  desconto_valor      NUMERIC DEFAULT 0,
  desconto_descricao  TEXT DEFAULT '',

  -- Seção 12 — Assinatura
  responsavel_nome    TEXT DEFAULT '',
  responsavel_cargo   TEXT DEFAULT '',

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ptc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ptc_user_policy" ON ptc
  USING (auth.uid() = user_id);

-- ── RVT — Relatório de Vistoria Técnica ──────────────────────
CREATE TABLE IF NOT EXISTS rvt (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  obra_id             UUID REFERENCES obras(id) ON DELETE SET NULL,

  -- Identificação
  numero              TEXT DEFAULT '',
  numero_completo     TEXT DEFAULT '',
  revisao             INTEGER DEFAULT 0,
  data_emissao        DATE DEFAULT CURRENT_DATE,
  status              TEXT DEFAULT 'rascunho',

  -- Tipo do relatório (exibido no cabeçalho)
  tipo_relatorio      TEXT DEFAULT 'VISTORIA TÉCNICA',
  subtipo_relatorio   TEXT DEFAULT 'ESTRUTURAL',

  -- Cliente / Unidade
  cliente_nome        TEXT DEFAULT '',
  unidade             TEXT DEFAULT '',
  descricao_assunto   TEXT DEFAULT '',

  -- Agradecimentos — [{nome, cargo, email, telefone}]
  contatos_cliente    JSONB DEFAULT '[]',

  -- Conteúdo textual
  texto_introducao    TEXT DEFAULT '',
  texto_patologia     TEXT DEFAULT '',

  -- Fotos — [{url, etapa, descricao, ordem}]
  fotos               JSONB DEFAULT '[]',

  -- Revisões — [{rev, data, descricao, elaboracao}]
  revisoes            JSONB DEFAULT '[]',

  -- Assinatura
  responsavel_nome    TEXT DEFAULT '',
  responsavel_cargo   TEXT DEFAULT '',

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rvt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rvt_user_policy" ON rvt
  USING (auth.uid() = user_id);

-- ── Dados iniciais: Tipos de Serviço ─────────────────────────
-- Execute separadamente após criar as tabelas, substituindo
-- 'SEU_USER_ID' pelo UUID do seu usuário em auth.users.
-- Exemplo:
--
-- INSERT INTO tipos_servico (user_id, nome, texto_objetivo, texto_observacoes, sequencia_padrao) VALUES
-- ('SEU_USER_ID',
--  'Revestimento impermeabilizante com PRFV (liner éster vinílica Derakane)',
--  'Em atendimento a vossa solicitação e oportunidade, segue nossas indicações e solução para o revestimento impermeabilizante anticorrosivo com PRFV (Plástico Reforçado com Fibra de Vidro), utilizando resina éster vinílica Derakane, para proteção integral da estrutura.',
--  'Por se tratar de um sistema de proteção anticorrosiva com PRFV, a superfície deve estar isenta de contaminantes, óleos, graxas e qualquer substância que prejudique a aderência do sistema. A temperatura de aplicação deve estar entre 15°C e 35°C, com umidade relativa abaixo de 85%.',
--  '[{"numero":"4.1","texto":"Isolamento da área de intervenção"},{"numero":"4.2","texto":"Preparação e limpeza da superfície (jateamento ou lixamento)"},{"numero":"4.3","texto":"Aplicação da manta de fibra de vidro com resina éster vinílica Derakane"},{"numero":"4.4","texto":"Acabamento e inspeção do revestimento"}]'
-- );
