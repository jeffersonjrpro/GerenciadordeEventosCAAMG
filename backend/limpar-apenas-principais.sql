-- =====================================================
-- SCRIPT SIMPLES - APENAS TABELAS PRINCIPAIS
-- =====================================================
-- Deleta apenas as tabelas que sabemos que existem

-- Deletar dados em ordem (respeitando chaves estrangeiras)
DELETE FROM "User";
DELETE FROM "Empresa";

-- Verificar resultado
SELECT 'RESULTADO:' as info;
SELECT 'Usuários restantes:' as tabela, COUNT(*) as total FROM "User"
UNION ALL
SELECT 'Empresas restantes:' as tabela, COUNT(*) as total FROM "Empresa";

-- Mensagem de confirmação
SELECT 'DADOS PRINCIPAIS DELETADOS!' as status; 