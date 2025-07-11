#!/bin/bash

echo "🚀 Instalando Gerenciador de Eventos CAAMG"
echo "=========================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não encontrado. Instale PostgreSQL primeiro."
    exit 1
fi

echo "✅ Dependências básicas verificadas"

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install

# Instalar node-cron para scheduler
npm install node-cron

# Voltar para o diretório raiz
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install

# Instalar dependências específicas
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
npm install react-quill dayjs

# Voltar para o diretório raiz
cd ..

echo "✅ Dependências instaladas com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o arquivo .env no backend"
echo "2. Configure o arquivo .env no frontend"
echo "3. Execute: cd backend && npx prisma migrate deploy"
echo "4. Execute: cd backend && node create-admin-master.js"
echo "5. Inicie o backend: cd backend && npm run dev"
echo "6. Inicie o frontend: cd frontend && npm start"
echo ""
echo "🎉 Instalação concluída!" 