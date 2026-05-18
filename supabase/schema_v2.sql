-- Migração v2: coluna extras nos orçamentos
-- Cole e execute no SQL Editor do Supabase

ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '{}'::jsonb;
