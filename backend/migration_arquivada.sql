-- Migração para adicionar campos de arquivamento à tabela demandas
-- Execute este SQL diretamente no banco PostgreSQL

-- Adicionar coluna arquivada (boolean, default false)
ALTER TABLE demandas 
ADD COLUMN IF NOT EXISTS arquivada BOOLEAN DEFAULT FALSE;

-- Adicionar coluna dataArquivamento (timestamp nullable)
ALTER TABLE demandas 
ADD COLUMN IF NOT EXISTS "dataArquivamento" TIMESTAMP;

-- Comentário para documentar as mudanças
COMMENT ON COLUMN demandas.arquivada IS 'Indica se a demanda foi arquivada';
COMMENT ON COLUMN demandas."dataArquivamento" IS 'Data e hora quando a demanda foi arquivada';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'demandas' 
AND column_name IN ('arquivada', 'dataArquivamento'); 