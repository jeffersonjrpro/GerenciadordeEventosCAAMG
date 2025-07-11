-- =====================================================
-- SCRIPT SIMPLES PARA LIMPAR DADOS PRINCIPAIS
-- =====================================================
-- Este script deleta apenas os dados principais
-- Mantém a estrutura das tabelas

-- Deletar dados em ordem (respeitando chaves estrangeiras)
DELETE FROM "CheckIn";
DELETE FROM "Guest";
DELETE FROM "Event";
DELETE FROM "User";
DELETE FROM "Empresa";

-- Verificar se foi deletado
SELECT 'Usuários restantes:' as info, COUNT(*) as total FROM "User"
UNION ALL
SELECT 'Empresas restantes:' as info, COUNT(*) as total FROM "Empresa"
UNION ALL
SELECT 'Eventos restantes:' as info, COUNT(*) as total FROM "Event";

-- Mensagem de confirmação
SELECT 'DADOS PRINCIPAIS DELETADOS!' as status; 