-- =============================================================
--  SISTEMA ENGENHARIA — Schema v7: Geocodificação de obras
--  Cole este arquivo no SQL Editor do Supabase e execute tudo.
-- =============================================================

-- Guarda qual endereço gerou o lat/lng atual. Quando difere de `endereco`
-- (ou é NULL, caso das obras criadas antes da geocodificação existir),
-- o app regeocodifica a obra e reposiciona o marcador no mapa de equipes.
ALTER TABLE obras ADD COLUMN IF NOT EXISTS geo_endereco TEXT;

-- As obras antigas receberam lat/lng aleatórios em torno do centro de São Paulo.
-- geo_endereco NULL já as marca como pendentes, então o app as corrige sozinho
-- no próximo carregamento. Nenhuma ação manual é necessária.
