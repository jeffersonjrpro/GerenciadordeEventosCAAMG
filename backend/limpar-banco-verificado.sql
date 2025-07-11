-- =====================================================
-- SCRIPT PARA LIMPAR BANCO COM VERIFICAÇÃO DE TABELAS
-- =====================================================
-- Este script verifica quais tabelas existem antes de deletar

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET session_replication_role = replica;

-- =====================================================
-- 1. VERIFICAR QUAIS TABELAS EXISTEM
-- =====================================================

SELECT 'TABELAS EXISTENTES NO BANCO:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =====================================================
-- 2. DELETAR DADOS DAS TABELAS QUE EXISTEM
-- =====================================================

-- Verificar e deletar CheckIn se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CheckIn') THEN
        DELETE FROM "CheckIn";
        RAISE NOTICE 'CheckIn deletado';
    ELSE
        RAISE NOTICE 'Tabela CheckIn não existe';
    END IF;
END $$;

-- Verificar e deletar Guest se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Guest') THEN
        DELETE FROM "Guest";
        RAISE NOTICE 'Guest deletado';
    ELSE
        RAISE NOTICE 'Tabela Guest não existe';
    END IF;
END $$;

-- Verificar e deletar Event se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Event') THEN
        DELETE FROM "Event";
        RAISE NOTICE 'Event deletado';
    ELSE
        RAISE NOTICE 'Tabela Event não existe';
    END IF;
END $$;

-- Verificar e deletar User se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User') THEN
        DELETE FROM "User";
        RAISE NOTICE 'User deletado';
    ELSE
        RAISE NOTICE 'Tabela User não existe';
    END IF;
END $$;

-- Verificar e deletar Empresa se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Empresa') THEN
        DELETE FROM "Empresa";
        RAISE NOTICE 'Empresa deletado';
    ELSE
        RAISE NOTICE 'Tabela Empresa não existe';
    END IF;
END $$;

-- Verificar e deletar Notification se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Notification') THEN
        DELETE FROM "Notification";
        RAISE NOTICE 'Notification deletado';
    ELSE
        RAISE NOTICE 'Tabela Notification não existe';
    END IF;
END $$;

-- Verificar e deletar File se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'File') THEN
        DELETE FROM "File";
        RAISE NOTICE 'File deletado';
    ELSE
        RAISE NOTICE 'Tabela File não existe';
    END IF;
END $$;

-- Verificar e deletar Demand se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Demand') THEN
        DELETE FROM "Demand";
        RAISE NOTICE 'Demand deletado';
    ELSE
        RAISE NOTICE 'Tabela Demand não existe';
    END IF;
END $$;

-- Verificar e deletar DemandCategory se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DemandCategory') THEN
        DELETE FROM "DemandCategory";
        RAISE NOTICE 'DemandCategory deletado';
    ELSE
        RAISE NOTICE 'Tabela DemandCategory não existe';
    END IF;
END $$;

-- Verificar e deletar Schedule se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Schedule') THEN
        DELETE FROM "Schedule";
        RAISE NOTICE 'Schedule deletado';
    ELSE
        RAISE NOTICE 'Tabela Schedule não existe';
    END IF;
END $$;

-- Verificar e deletar Config se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Config') THEN
        DELETE FROM "Config";
        RAISE NOTICE 'Config deletado';
    ELSE
        RAISE NOTICE 'Tabela Config não existe';
    END IF;
END $$;

-- =====================================================
-- 3. RESETAR SEQUENCIAS (se existirem)
-- =====================================================

-- Resetar sequências para começar do 1 novamente
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_name = 'User_id_seq') THEN
        ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
        RAISE NOTICE 'Sequência User_id_seq resetada';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_name = 'Event_id_seq') THEN
        ALTER SEQUENCE "Event_id_seq" RESTART WITH 1;
        RAISE NOTICE 'Sequência Event_id_seq resetada';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_name = 'Empresa_id_seq') THEN
        ALTER SEQUENCE "Empresa_id_seq" RESTART WITH 1;
        RAISE NOTICE 'Sequência Empresa_id_seq resetada';
    END IF;
END $$;

-- =====================================================
-- 4. REABILITAR VERIFICAÇÃO DE CHAVES ESTRANGEIRAS
-- =====================================================

SET session_replication_role = DEFAULT;

-- =====================================================
-- 5. VERIFICAR RESULTADO FINAL
-- =====================================================

SELECT 'RESULTADO FINAL - CONTAGEM DE REGISTROS:' as info;

-- Contar registros em cada tabela que existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User') THEN
        RAISE NOTICE 'User: % registros', (SELECT COUNT(*) FROM "User");
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Event') THEN
        RAISE NOTICE 'Event: % registros', (SELECT COUNT(*) FROM "Event");
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Empresa') THEN
        RAISE NOTICE 'Empresa: % registros', (SELECT COUNT(*) FROM "Empresa");
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Guest') THEN
        RAISE NOTICE 'Guest: % registros', (SELECT COUNT(*) FROM "Guest");
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CheckIn') THEN
        RAISE NOTICE 'CheckIn: % registros', (SELECT COUNT(*) FROM "CheckIn");
    END IF;
END $$;

-- =====================================================
-- MENSAGEM DE CONFIRMAÇÃO
-- =====================================================

SELECT 'BANCO DE DADOS LIMPO COM SUCESSO!' as status;
SELECT 'Agora você pode começar do zero!' as proximo_passo; 