@echo off
echo ========================================
echo    INSTALADOR AUTOMATICO - SERVIDOR
echo ========================================
echo.

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado!
    echo Por favor, instale o Node.js primeiro: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado: 
node --version

echo.
echo [2/6] Instalando dependencias do Backend...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias do backend!
    pause
    exit /b 1
)
echo ✅ Dependencias do backend instaladas!

echo.
echo [3/6] Instalando dependencias do Frontend...
cd ..\frontend
npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias do frontend!
    pause
    exit /b 1
)
echo ✅ Dependencias do frontend instaladas!

echo.
echo [4/6] Gerando cliente Prisma...
cd ..\backend
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Erro ao gerar cliente Prisma!
    pause
    exit /b 1
)
echo ✅ Cliente Prisma gerado!

echo.
echo [5/6] Verificando arquivos de configuracao...
if not exist ".env" (
    echo ⚠️  Arquivo .env nao encontrado no backend!
    echo Copiando exemplo...
    copy "env.example" ".env"
    echo ✅ Arquivo .env criado! Configure as variaveis de ambiente.
)

cd ..\frontend
if not exist ".env" (
    echo ⚠️  Arquivo .env nao encontrado no frontend!
    echo Copiando exemplo...
    copy ".env.example" ".env"
    echo ✅ Arquivo .env criado! Configure as variaveis de ambiente.
)

echo.
echo [6/6] Testando conexao com servidor de arquivos...
cd ..\backend
set NODE_OPTIONS=--openssl-legacy-provider
node -e "
const SMB2 = require('smb2');
const smbClient = new SMB2({
    share: 'caafiles-v\\App_Eventos',
    username: 'eventos',
    password: 'Caa.@silver25',
    domain: 'caamg'
});

smbClient.readdir('\\\\', (err, files) => {
    if (err) {
        console.log('❌ Erro ao conectar com servidor de arquivos:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conexao com servidor de arquivos estabelecida!');
        process.exit(0);
    }
    smbClient.close();
});
"

echo.
echo ========================================
echo    INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo ✅ Backend: cd backend && npm start
echo ✅ Frontend: cd frontend && npm start
echo.
echo ⚠️  IMPORTANTE: Configure os arquivos .env antes de executar!
echo.
pause 