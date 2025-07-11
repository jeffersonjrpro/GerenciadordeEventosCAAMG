#!/bin/bash

echo "========================================"
echo "    INSTALADOR AUTOMATICO - SERVIDOR"
echo "========================================"
echo

echo "[1/6] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "Por favor, instale o Node.js primeiro: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js encontrado: $(node --version)"

echo
echo "[2/6] Instalando dependências do Backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend!"
    exit 1
fi
echo "✅ Dependências do backend instaladas!"

echo
echo "[3/6] Instalando dependências do Frontend..."
cd ../frontend
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do frontend!"
    exit 1
fi
echo "✅ Dependências do frontend instaladas!"

echo
echo "[4/6] Gerando cliente Prisma..."
cd ../backend
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Erro ao gerar cliente Prisma!"
    exit 1
fi
echo "✅ Cliente Prisma gerado!"

echo
echo "[5/6] Verificando arquivos de configuração..."
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado no backend!"
    echo "Copiando exemplo..."
    cp "env.example" ".env"
    echo "✅ Arquivo .env criado! Configure as variáveis de ambiente."
fi

cd ../frontend
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado no frontend!"
    echo "Copiando exemplo..."
    cp ".env.example" ".env"
    echo "✅ Arquivo .env criado! Configure as variáveis de ambiente."
fi

echo
echo "[6/6] Testando conexão com servidor de arquivos..."
cd ../backend
export NODE_OPTIONS=--openssl-legacy-provider
node -e "
const SMB2 = require('smb2');
const smbClient = new SMB2({
    share: 'caafiles-v\\\\App_Eventos',
    username: 'eventos',
    password: 'Caa.@silver25',
    domain: 'caamg'
});

smbClient.readdir('\\\\\\\\', (err, files) => {
    if (err) {
        console.log('❌ Erro ao conectar com servidor de arquivos:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conexão com servidor de arquivos estabelecida!');
        process.exit(0);
    }
    smbClient.close();
});
"

echo
echo "========================================"
echo "    INSTALAÇÃO CONCLUÍDA!"
echo "========================================"
echo
echo "✅ Backend: cd backend && npm start"
echo "✅ Frontend: cd frontend && npm start"
echo
echo "⚠️  IMPORTANTE: Configure os arquivos .env antes de executar!"
echo 