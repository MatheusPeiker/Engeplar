-- =============================================================
--  SISTEMA ENGENHARIA — Schema v5: Módulo RTE (Relatório Técnico de Execução)
--  Cole este arquivo no SQL Editor do Supabase e execute tudo.
-- =============================================================

-- ── Novos campos em obras ─────────────────────────────────────
ALTER TABLE obras ADD COLUMN IF NOT EXISTS rte_numero            TEXT    DEFAULT '';
ALTER TABLE obras ADD COLUMN IF NOT EXISTS pedido_numero         TEXT    DEFAULT '';
ALTER TABLE obras ADD COLUMN IF NOT EXISTS pedido_data           DATE;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS art_numero            TEXT    DEFAULT '';
ALTER TABLE obras ADD COLUMN IF NOT EXISTS art_data              DATE;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS nf_numero             TEXT    DEFAULT '';
ALTER TABLE obras ADD COLUMN IF NOT EXISTS nf_data               DATE;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS tipo_servico          TEXT    DEFAULT '';
ALTER TABLE obras ADD COLUMN IF NOT EXISTS material_equipamento  TEXT    DEFAULT '';
ALTER TABLE obras ADD COLUMN IF NOT EXISTS dimensoes             JSONB   DEFAULT '{"diametro":"","altura":"","area":""}';
ALTER TABLE obras ADD COLUMN IF NOT EXISTS garantia_meses        INTEGER DEFAULT 36;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS inspecao_meses        INTEGER DEFAULT 12;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS responsavel_cliente   TEXT    DEFAULT '';
ALTER TABLE obras ADD COLUMN IF NOT EXISTS descricao_tecnica     TEXT    DEFAULT '';
ALTER TABLE obras ADD COLUMN IF NOT EXISTS dados_rte             JSONB   DEFAULT '{}';

-- ── Novos campos em clientes ──────────────────────────────────
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS contato_nome  TEXT DEFAULT '';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS contato_email TEXT DEFAULT '';

-- ── Novo campo em propostas ───────────────────────────────────
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS ptc_numero TEXT DEFAULT '';

-- ── Sequência de numeração PTC / RTE ─────────────────────────
CREATE TABLE IF NOT EXISTS documento_sequencia (
  tipo         TEXT    PRIMARY KEY,   -- 'PTC' ou 'RTE'
  ultimo_numero INTEGER DEFAULT 0,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE documento_sequencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doc_seq_user_policy" ON documento_sequencia;
CREATE POLICY "doc_seq_user_policy" ON documento_sequencia
  USING (auth.uid() = user_id);

-- Inicializa sequências para o usuário logado (execute após criar a tabela):
-- INSERT INTO documento_sequencia (tipo, ultimo_numero, user_id)
-- VALUES ('PTC', 0, auth.uid()), ('RTE', 0, auth.uid())
-- ON CONFLICT (tipo) DO NOTHING;
