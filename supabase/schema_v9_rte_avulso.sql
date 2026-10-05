-- =============================================================
--  SISTEMA ENGENHARIA — Schema v9: RTE independente da obra
--  Cole este arquivo no SQL Editor do Supabase e execute tudo.
--  Idempotente: pode rodar mais de uma vez sem duplicar nada.
--
--  Até a v8 o RTE vivia em colunas da tabela `obras` (schema_v5_rte.sql),
--  então só existia um RTE por obra e não dava para emitir sem obra.
--  Agora ele tem tabela própria; a obra vira um vínculo opcional.
--  As colunas antigas em `obras` ficam intocadas (não são mais usadas).
-- =============================================================

CREATE TABLE IF NOT EXISTS rte (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  obra_id               UUID REFERENCES obras(id) ON DELETE SET NULL,
  ptc_id                UUID REFERENCES ptc(id)   ON DELETE SET NULL,

  -- Identificação
  numero_completo       TEXT    DEFAULT '',
  status                TEXT    DEFAULT 'rascunho',
  data_emissao          DATE    DEFAULT CURRENT_DATE,
  tipo_servico          TEXT    DEFAULT '',
  dados_rte             JSONB   DEFAULT '{}',

  -- Contratante / execução (preenchidos à mão quando não há obra)
  cliente_nome          TEXT    DEFAULT '',
  local                 TEXT    DEFAULT '',
  responsavel_cliente   TEXT    DEFAULT '',
  periodo_inicio        DATE,
  periodo_fim           DATE,
  tecnico_nome          TEXT    DEFAULT '',
  tecnico_cargo         TEXT    DEFAULT '',

  -- Dados fiscais
  pedido_numero         TEXT    DEFAULT '',
  pedido_data           DATE,
  art_numero            TEXT    DEFAULT '',
  art_data              DATE,
  nf_numero             TEXT    DEFAULT '',
  nf_data               DATE,

  -- Equipamento / garantia
  material_equipamento  TEXT    DEFAULT '',
  dimensoes             JSONB   DEFAULT '{"diametro":"","altura":"","area":""}',
  garantia_meses        INTEGER DEFAULT 36,
  inspecao_meses        INTEGER DEFAULT 12,
  descricao_tecnica     TEXT    DEFAULT '',

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rte ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rte_user_policy" ON rte;
CREATE POLICY "rte_user_policy" ON rte
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Migra os RTEs que já foram preenchidos dentro das obras ──
INSERT INTO rte (
  user_id, obra_id, numero_completo, tipo_servico, dados_rte,
  cliente_nome, local, responsavel_cliente,
  pedido_numero, pedido_data, art_numero, art_data, nf_numero, nf_data,
  material_equipamento, dimensoes, garantia_meses, inspecao_meses, descricao_tecnica
)
SELECT
  o.user_id, o.id, COALESCE(o.rte_numero, ''), COALESCE(o.tipo_servico, ''), COALESCE(o.dados_rte, '{}'),
  COALESCE(o.nome, ''), COALESCE(o.endereco, ''), COALESCE(o.responsavel_cliente, ''),
  COALESCE(o.pedido_numero, ''), o.pedido_data, COALESCE(o.art_numero, ''), o.art_data,
  COALESCE(o.nf_numero, ''), o.nf_data,
  COALESCE(o.material_equipamento, ''), COALESCE(o.dimensoes, '{"diametro":"","altura":"","area":""}'),
  COALESCE(o.garantia_meses, 36), COALESCE(o.inspecao_meses, 12), COALESCE(o.descricao_tecnica, '')
FROM obras o
WHERE (COALESCE(o.rte_numero, '') <> ''
    OR COALESCE(o.tipo_servico, '') <> ''
    OR COALESCE(o.descricao_tecnica, '') <> '')
  AND NOT EXISTS (SELECT 1 FROM rte r WHERE r.obra_id = o.id);
