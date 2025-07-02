-- =====================================================
-- MIGRAÇÃO COMPLETA PARA SISTEMA DE EVENTOS CAAMG
-- Execute este SQL em um banco PostgreSQL limpo
-- =====================================================

-- 1. ADICIONAR CAMPOS DE ARQUIVAMENTO À TABELA DEMANDAS
-- =====================================================

-- Adicionar coluna arquivada (boolean, default false)
ALTER TABLE demandas 
ADD COLUMN IF NOT EXISTS arquivada BOOLEAN DEFAULT FALSE;

-- Adicionar coluna dataArquivamento (timestamp nullable)
ALTER TABLE demandas 
ADD COLUMN IF NOT EXISTS "dataArquivamento" TIMESTAMP;

-- Comentários para documentar as mudanças
COMMENT ON COLUMN demandas.arquivada IS 'Indica se a demanda foi arquivada';
COMMENT ON COLUMN demandas."dataArquivamento" IS 'Data e hora quando a demanda foi arquivada';

-- 2. CRIAR TABELA ARQUIVOS_DEMANDA
-- =====================================================

-- Criar tabela arquivos_demanda
CREATE TABLE IF NOT EXISTS arquivos_demanda (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "nomeOriginal" VARCHAR(255) NOT NULL,
    "nomeArquivo" VARCHAR(255) NOT NULL,
    caminho VARCHAR(500) NOT NULL,
    tamanho INTEGER NOT NULL,
    "tipoMime" VARCHAR(100) NOT NULL,
    "demandaId" TEXT NOT NULL,
    "uploadPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY ("demandaId") REFERENCES demandas(id) ON DELETE CASCADE,
    FOREIGN KEY ("uploadPorId") REFERENCES users(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_arquivos_demanda_demanda_id ON arquivos_demanda("demandaId");
CREATE INDEX IF NOT EXISTS idx_arquivos_demanda_upload_por ON arquivos_demanda("uploadPorId");

-- Comentários para documentação
COMMENT ON TABLE arquivos_demanda IS 'Tabela para armazenar arquivos anexados às demandas';
COMMENT ON COLUMN arquivos_demanda."nomeOriginal" IS 'Nome original do arquivo enviado pelo usuário';
COMMENT ON COLUMN arquivos_demanda."nomeArquivo" IS 'Nome único do arquivo no servidor';
COMMENT ON COLUMN arquivos_demanda.caminho IS 'Caminho relativo do arquivo no sistema de arquivos';
COMMENT ON COLUMN arquivos_demanda.tamanho IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN arquivos_demanda."tipoMime" IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN arquivos_demanda."demandaId" IS 'ID da demanda à qual o arquivo pertence';
COMMENT ON COLUMN arquivos_demanda."uploadPorId" IS 'ID do usuário que fez o upload';
COMMENT ON COLUMN arquivos_demanda."criadoEm" IS 'Data e hora do upload';

-- 3. VERIFICAR ESTRUTURAS CRIADAS
-- =====================================================

-- Verificar se as colunas foram criadas na tabela demandas
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'demandas' 
AND column_name IN ('arquivada', 'dataArquivamento');

-- Verificar se a tabela arquivos_demanda foi criada
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'arquivos_demanda';

-- Verificar estrutura da tabela arquivos_demanda
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'arquivos_demanda'
ORDER BY ordinal_position;

-- 4. VERIFICAR ÍNDICES
-- =====================================================

-- Verificar índices da tabela arquivos_demanda
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'arquivos_demanda';

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA
-- ===================================================== 