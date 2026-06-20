-- Schema v6: campos PTC na tabela propostas
-- Execute no Supabase SQL Editor

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS ptc_numero       TEXT,
  ADD COLUMN IF NOT EXISTS revisao          TEXT DEFAULT 'REV00',
  ADD COLUMN IF NOT EXISTS elaboracao       TEXT,
  ADD COLUMN IF NOT EXISTS visita           TEXT,
  ADD COLUMN IF NOT EXISTS objetivo         TEXT,
  ADD COLUMN IF NOT EXISTS prazo_execucao   TEXT,
  ADD COLUMN IF NOT EXISTS nao_incluso      TEXT,
  ADD COLUMN IF NOT EXISTS notas            TEXT,
  ADD COLUMN IF NOT EXISTS pagamento_dias   INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS validade_dias    INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS frete            TEXT DEFAULT 'CIF',
  ADD COLUMN IF NOT EXISTS mobilizacao_obs  TEXT DEFAULT 'A combinar';
