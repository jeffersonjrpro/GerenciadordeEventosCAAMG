-- Verificar se o ownerId foi definido corretamente
SELECT 
    e.id as empresa_id,
    e.nome as empresa_nome,
    e."ownerId" as owner_id,
    u.name as owner_name,
    u.email as owner_email
FROM "empresas" e
LEFT JOIN "users" u ON e."ownerId" = u.id
WHERE e.id = 'cmcp99nf000009z709rkjmsyq'; 