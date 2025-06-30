#!/bin/sh
set -e

echo "🚀 Iniciando backend do Gerenciador de Eventos..."

# Aguardar banco de dados estar disponível
echo "⏳ Aguardando banco de dados..."
until pg_isready -h postgres -p 5432 -U ${DATABASE_USER:-postgres}; do
  echo "Banco de dados não está pronto - aguardando..."
  sleep 2
done

echo "✅ Banco de dados conectado!"

# Executar migrações do Prisma
echo "🔄 Executando migrações do banco de dados..."
npx prisma migrate deploy

# Gerar Prisma Client novamente (garantir compatibilidade)
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Verificar se existem usuários admin
echo "👤 Verificando usuários admin..."
node check-admins.js || echo "Admin master será criado automaticamente no primeiro acesso"

echo "✅ Backend iniciado com sucesso!"

# Executar comando passado como parâmetro
exec "$@" 