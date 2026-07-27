-- schema_v8_ptc_layout.sql — campos usados pelo novo gerador da PTC
-- Execute no Supabase SQL Editor. Idempotente (ADD COLUMN IF NOT EXISTS).
--
-- IMPORTANTE: o editor de PTC do app grava na tabela `ptc` (ver addPTC/updatePTC
-- em src/context/AppContext.jsx). O INTEGRACAO_PTC_TEMPLATES.md sugere alterar
-- `propostas`, que é a tabela do fluxo antigo de proposta — não é onde a PTC
-- deste app é salva. Por isso as colunas abaixo vão em `ptc`.
--
-- Sem esta migração, selecionar o tipo de serviço no formulário parece funcionar
-- (o estado local atualiza) mas não persiste: o update no Supabase falha porque
-- a coluna não existe.

-- ─── 1. Colunas novas na tabela ptc ──────────────────────────────────────────
ALTER TABLE ptc
  -- Tipo de serviço da biblioteca de templates (REVEST_PRFV, PISO_URETANO, ...)
  ADD COLUMN IF NOT EXISTS tipo_servico_codigo TEXT,

  -- SEM DEFAULT de propósito: quando ficam nulos, o documento usa o valor do
  -- tipo de serviço (garantia de 36m no PRFV, 60m no piso, nenhuma na diária;
  -- unidade m2/diaria/medicao conforme o tipo).
  ADD COLUMN IF NOT EXISTS garantia_meses      INTEGER,
  ADD COLUMN IF NOT EXISTS unidade_medida      TEXT,

  -- Saudação / destinatário
  ADD COLUMN IF NOT EXISTS cliente_celular     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cidade_emissao      TEXT DEFAULT 'Rio dos Cedros - SC',

  -- Condições gerais (mesmos defaults do schema_v6_ptc.sql, que os criou em propostas)
  ADD COLUMN IF NOT EXISTS pagamento_dias      INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS validade_dias       INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS frete               TEXT DEFAULT 'CIF',
  ADD COLUMN IF NOT EXISTS inicio_obs          TEXT DEFAULT 'A combinar',
  ADD COLUMN IF NOT EXISTS mobilizacao_obs     TEXT DEFAULT 'A combinar';


-- ─── 2. OPCIONAL — biblioteca de templates no banco ──────────────────────────
-- Hoje a biblioteca vive no código (src/lib/ptcTemplates.js) e o app NÃO lê
-- estas tabelas: rodar esta parte não muda nada no funcionamento. Serve para
-- quando você quiser editar os textos dos templates fora do código.
--
-- Passo 1: cole o conteúdo de schema_v7_ptc_templates.sql no SQL Editor.
--          (o comando \i do .md é do psql e não funciona no editor web)
-- Passo 2: rode o bloco abaixo para proteger as tabelas criadas.
--
-- Por que: tabelas criadas por SQL no Supabase nascem SEM RLS, e os papéis
-- anon/authenticated têm grant de escrita por padrão — sem as políticas abaixo,
-- qualquer um com a chave anônima poderia alterar seus templates. Elas são
-- dados de referência compartilhados (não têm user_id), então a regra é:
-- leitura para autenticados, escrita só pelo service_role/painel.

-- ALTER TABLE ptc_tipo_servico    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ptc_sequencia_etapa ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ptc_item_catalogo   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ptc_bloco_fixo      ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "leitura_autenticada" ON ptc_tipo_servico;
-- DROP POLICY IF EXISTS "leitura_autenticada" ON ptc_sequencia_etapa;
-- DROP POLICY IF EXISTS "leitura_autenticada" ON ptc_item_catalogo;
-- DROP POLICY IF EXISTS "leitura_autenticada" ON ptc_bloco_fixo;
--
-- CREATE POLICY "leitura_autenticada" ON ptc_tipo_servico    FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "leitura_autenticada" ON ptc_sequencia_etapa FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "leitura_autenticada" ON ptc_item_catalogo   FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "leitura_autenticada" ON ptc_bloco_fixo      FOR SELECT TO authenticated USING (true);
--
-- Integridade referencial (só depois de rodar o schema_v7):
-- ALTER TABLE ptc ADD CONSTRAINT ptc_tipo_servico_codigo_fkey
--   FOREIGN KEY (tipo_servico_codigo) REFERENCES ptc_tipo_servico(codigo);


-- ─── 3. Conferência ──────────────────────────────────────────────────────────
-- Deve retornar as 10 colunas do passo 1:
-- SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--  WHERE table_name = 'ptc'
--    AND column_name IN ('tipo_servico_codigo','garantia_meses','unidade_medida',
--                        'cliente_celular','cidade_emissao','pagamento_dias',
--                        'validade_dias','frete','inicio_obs','mobilizacao_obs')
--  ORDER BY column_name;
