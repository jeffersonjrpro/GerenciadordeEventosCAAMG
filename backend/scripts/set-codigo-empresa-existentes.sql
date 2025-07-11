-- Popula o campo 'codigo' das empresas já existentes com um código aleatório de 8 caracteres
UPDATE "empresas"
SET "codigo" = SUBSTRING(MD5(RANDOM()::text), 1, 8)
WHERE "codigo" IS NULL; 