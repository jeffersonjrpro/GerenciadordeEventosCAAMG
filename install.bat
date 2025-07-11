@echo off
echo 🚀 Instalando Gerenciador de Eventos CAAMG
echo ==========================================

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Instale Node.js 18+ primeiro.
    pause
    exit /b 1
)

REM Verificar se PostgreSQL está instalado
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL não encontrado. Instale PostgreSQL primeiro.
    pause
    exit /b 1
)

echo ✅ Dependências básicas verificadas

REM Instalar dependências do backend
echo 📦 Instalando dependências do backend...
cd backend
call npm install

REM Instalar node-cron para scheduler
call npm install node-cron

REM Voltar para o diretório raiz
cd ..

REM Instalar dependências do frontend
echo 📦 Instalando dependências do frontend...
cd frontend
call npm install

REM Instalar dependências específicas
call npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
call npm install react-quill dayjs

REM Voltar para o diretório raiz
cd ..

echo ✅ Dependências instaladas com sucesso!
echo.
echo 📋 Próximos passos:
echo 1. Configure o arquivo .env no backend
echo 2. Configure o arquivo .env no frontend
echo 3. Execute: cd backend ^&^& npx prisma migrate deploy
echo 4. Execute: cd backend ^&^& node create-admin-master.js
echo 5. Inicie o backend: cd backend ^&^& npm run dev
echo 6. Inicie o frontend: cd frontend ^&^& npm start
echo.
echo 🎉 Instalação concluída!
pause 