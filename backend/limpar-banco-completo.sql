-- =====================================================
-- SCRIPT PARA LIMPAR COMPLETAMENTE O BANCO DE DADOS
-- =====================================================
-- ATENÇÃO: Este script irá deletar TODOS os dados!
-- Execute apenas se tiver certeza que quer começar do zero.

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET session_replication_role = replica;

-- =====================================================
-- 1. DELETAR TODOS OS DADOS DAS TABELAS
-- =====================================================

-- Deletar check-ins
DELETE FROM "CheckIn";

-- Deletar convidados
DELETE FROM "Guest";

-- Deletar eventos
DELETE FROM "Event";

-- Deletar usuários
DELETE FROM "User";

-- Deletar empresas
DELETE FROM "Empresa";

-- Deletar notificações
DELETE FROM "Notification";

-- Deletar arquivos
DELETE FROM "File";

-- Deletar demandas
DELETE FROM "Demand";

-- Deletar categorias de demandas
DELETE FROM "DemandCategory";

-- Deletar agendamentos
DELETE FROM "Schedule";

-- Deletar configurações
DELETE FROM "Config";

-- =====================================================
-- 2. RESETAR SEQUENCIAS (AUTO INCREMENT)
-- =====================================================

-- Resetar sequências para começar do 1 novamente
ALTER SEQUENCE IF EXISTS "User_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "Event_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "Empresa_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "Guest_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "CheckIn_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "Notification_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "File_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "Demand_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "DemandCategory_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "Schedule_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "Config_id_seq" RESTART WITH 1;

-- =====================================================
-- 3. REABILITAR VERIFICAÇÃO DE CHAVES ESTRANGEIRAS
-- =====================================================

SET session_replication_role = DEFAULT;

-- =====================================================
-- 4. VERIFICAR SE TUDO FOI DELETADO
-- =====================================================

-- Contar registros em cada tabela
SELECT 'User' as tabela, COUNT(*) as total FROM "User"
UNION ALL
SELECT 'Event' as tabela, COUNT(*) as total FROM "Event"
UNION ALL
SELECT 'Empresa' as tabela, COUNT(*) as total FROM "Empresa"
UNION ALL
SELECT 'Guest' as tabela, COUNT(*) as total FROM "Guest"
UNION ALL
SELECT 'CheckIn' as tabela, COUNT(*) as total FROM "CheckIn"
UNION ALL
SELECT 'Notification' as tabela, COUNT(*) as total FROM "Notification"
UNION ALL
SELECT 'File' as tabela, COUNT(*) as total FROM "File"
UNION ALL
SELECT 'Demand' as tabela, COUNT(*) as total FROM "Demand"
UNION ALL
SELECT 'DemandCategory' as tabela, COUNT(*) as total FROM "DemandCategory"
UNION ALL
SELECT 'Schedule' as tabela, COUNT(*) as total FROM "Schedule"
UNION ALL
SELECT 'Config' as tabela, COUNT(*) as total FROM "Config";

-- =====================================================
-- MENSAGEM DE CONFIRMAÇÃO
-- =====================================================

SELECT 'BANCO DE DADOS LIMPO COM SUCESSO!' as status;
SELECT 'Agora você pode começar do zero!' as proximo_passo; 