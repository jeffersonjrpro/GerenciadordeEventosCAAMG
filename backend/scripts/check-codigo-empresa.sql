-- Verificar se o código da empresa foi definido corretamente
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u."codigoEmpresa" as codigo_empresa,
    u."empresaId" as empresa_id,
    e.nome as empresa_nome
FROM "users" u
LEFT JOIN "empresas" e ON u."empresaId" = e.id
WHERE u.email = 'jefferson.martins@caamg.com.br'; 