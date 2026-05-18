-- =============================================================
--  Migração v3: tabela historico + RLS
--  Cole e execute no SQL Editor do Supabase
-- =============================================================

-- Tabela de histórico de alterações
CREATE TABLE IF NOT EXISTS historico (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  modulo      TEXT DEFAULT '',
  campo       TEXT DEFAULT '',
  anterior    TEXT,
  novo        TEXT,
  obra_id     UUID REFERENCES obras(id) ON DELETE SET NULL,
  entity_id   TEXT,
  entity_type TEXT,
  desfeito    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_user ON historico(user_id);
CREATE INDEX IF NOT EXISTS idx_historico_obra ON historico(obra_id);

ALTER TABLE historico ENABLE ROW LEVEL SECURITY;

-- Cria policy apenas se ainda não existir (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'historico' AND policyname = 'own_data'
  ) THEN
    CREATE POLICY "own_data" ON historico
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Coluna status na tabela propostas (caso ainda não exista)
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'rascunho';
