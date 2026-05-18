-- =============================================================
--  SISTEMA ENGENHARIA — Schema Supabase
--  Cole este arquivo no SQL Editor do seu projeto Supabase
--  e execute tudo de uma vez.
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- TABELAS
-- ────────────────────────────────────────────────────────────

-- Empresa (uma por usuário)
CREATE TABLE IF NOT EXISTS empresa (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  razao_social    TEXT DEFAULT '',
  nome_fantasia   TEXT DEFAULT '',
  cnpj            TEXT DEFAULT '',
  inscricao_estadual TEXT DEFAULT '',
  endereco        TEXT DEFAULT '',
  telefone        TEXT DEFAULT '',
  email           TEXT DEFAULT '',
  site            TEXT DEFAULT '',
  logo            TEXT DEFAULT '',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome        TEXT NOT NULL DEFAULT '',
  contato     TEXT DEFAULT '',
  telefone    TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  tipo        TEXT DEFAULT 'Jurídica',
  cnpj        TEXT DEFAULT '',
  endereco    TEXT DEFAULT '',
  pagamento   TEXT DEFAULT 'À Vista',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome        TEXT NOT NULL DEFAULT '',
  contato     TEXT DEFAULT '',
  telefone    TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  categoria   TEXT DEFAULT '',
  cnpj        TEXT DEFAULT '',
  materiais   TEXT DEFAULT '',
  pagamento   TEXT DEFAULT 'Boleto 30 dias',
  prazo       TEXT DEFAULT 'Imediato',
  endereco    TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Obras
CREATE TABLE IF NOT EXISTS obras (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome        TEXT NOT NULL DEFAULT '',
  endereco    TEXT DEFAULT '',
  lat         FLOAT DEFAULT -23.5505,
  lng         FLOAT DEFAULT -46.6333,
  status      TEXT DEFAULT 'Em andamento',
  previsao    TEXT DEFAULT '',
  orcamento   FLOAT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos / Despesas (filho de obras)
CREATE TABLE IF NOT EXISTS gastos_despesas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  obra_id     UUID REFERENCES obras(id) ON DELETE CASCADE NOT NULL,
  descricao   TEXT DEFAULT '',
  valor       FLOAT DEFAULT 0,
  data        TEXT DEFAULT '',
  categoria   TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome        TEXT NOT NULL DEFAULT '',
  obra_id     UUID REFERENCES obras(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Itens de Orçamento (filho de orcamentos)
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  orcamento_id    UUID REFERENCES orcamentos(id) ON DELETE CASCADE NOT NULL,
  descricao       TEXT DEFAULT '',
  categoria       TEXT DEFAULT '',
  unidade         TEXT DEFAULT 'un',
  quantidade      FLOAT DEFAULT 1,
  custo_unitario  FLOAT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Propostas
CREATE TABLE IF NOT EXISTS propostas (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome                  TEXT NOT NULL DEFAULT '',
  obra_id               UUID REFERENCES obras(id) ON DELETE SET NULL,
  orcamento_id          UUID REFERENCES orcamentos(id) ON DELETE SET NULL,
  cliente_nome          TEXT DEFAULT '',
  cliente_cnpj          TEXT DEFAULT '',
  cliente_endereco      TEXT DEFAULT '',
  margem_lucro          FLOAT DEFAULT 20,
  impostos              FLOAT DEFAULT 6,
  condicoes_pagamento   TEXT DEFAULT '30 dias',
  valor_proposto        FLOAT,
  observacoes           TEXT DEFAULT '',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Cronogramas
CREATE TABLE IF NOT EXISTS cronogramas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  obra_id     UUID REFERENCES obras(id) ON DELETE CASCADE NOT NULL,
  etapa       TEXT NOT NULL DEFAULT '',
  data_inicio DATE,
  data_fim    DATE,
  custo       FLOAT DEFAULT 0,
  progresso   FLOAT DEFAULT 0,
  cor         TEXT DEFAULT '#1E3A8A',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Arquivos
CREATE TABLE IF NOT EXISTS arquivos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  obra_id      UUID REFERENCES obras(id) ON DELETE CASCADE NOT NULL,
  nome         TEXT DEFAULT '',
  tipo         TEXT DEFAULT '',
  tamanho      TEXT DEFAULT '',
  vinculo      TEXT DEFAULT '',
  data_criacao DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome             TEXT NOT NULL DEFAULT '',
  funcao           TEXT DEFAULT '',
  custo_diaria     FLOAT DEFAULT 0,
  dias_trabalhados FLOAT DEFAULT 0,
  obra_atual_id    UUID REFERENCES obras(id) ON DELETE SET NULL,
  desempenho       TEXT DEFAULT 'Avaliando',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Registros de Desempenho
CREATE TABLE IF NOT EXISTS registros_desempenho (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  funcionario_id  UUID REFERENCES funcionarios(id) ON DELETE CASCADE NOT NULL,
  mes             TEXT DEFAULT '',
  ano             INT DEFAULT 2025,
  performance     INT DEFAULT 100,
  valor_gerado    FLOAT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo de Preços
CREATE TABLE IF NOT EXISTS catalogo (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome        TEXT NOT NULL DEFAULT '',
  tipo        TEXT DEFAULT 'Fixo',
  custo       FLOAT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Transações Financeiras
CREATE TABLE IF NOT EXISTS transacoes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  descricao   TEXT DEFAULT '',
  obra_id     UUID REFERENCES obras(id) ON DELETE SET NULL,
  data        DATE,
  valor       FLOAT DEFAULT 0,
  tipo        TEXT DEFAULT 'saida',
  status      TEXT DEFAULT 'pendente',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Compras / Suprimentos
CREATE TABLE IF NOT EXISTS compras (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  obra_id     UUID REFERENCES obras(id) ON DELETE SET NULL,
  etapa       TEXT DEFAULT '',
  status      TEXT DEFAULT 'cotacao',
  fornecedor  TEXT DEFAULT '',
  itens       TEXT DEFAULT '',
  data_pedida DATE,
  previsao    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- ÍNDICES (performance)
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clientes_user           ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_user       ON fornecedores(user_id);
CREATE INDEX IF NOT EXISTS idx_obras_user              ON obras(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_obra             ON gastos_despesas(obra_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_user         ON orcamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orc     ON orcamento_itens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_propostas_user          ON propostas(user_id);
CREATE INDEX IF NOT EXISTS idx_cronogramas_obra        ON cronogramas(obra_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_obra           ON arquivos(obra_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_user       ON funcionarios(user_id);
CREATE INDEX IF NOT EXISTS idx_desempenho_func         ON registros_desempenho(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_user         ON transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_compras_user            ON compras(user_id);


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário só vê e edita os próprios dados.
-- ────────────────────────────────────────────────────────────

ALTER TABLE empresa              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras                ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_despesas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cronogramas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE arquivos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_desempenho ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras              ENABLE ROW LEVEL SECURITY;

-- Macro para criar a policy padrão "usuário acessa apenas seus dados"
-- Execute bloco por bloco se preferir.

CREATE POLICY "own_data" ON empresa              FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON clientes             FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON fornecedores         FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON obras                FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON gastos_despesas      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON orcamentos           FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON orcamento_itens      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON propostas            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON cronogramas          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON arquivos             FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON funcionarios         FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON registros_desempenho FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON catalogo             FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON transacoes           FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON compras              FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
