@echo off
echo ========================================
echo Configuracao Local - Sistema CAAMG
echo ========================================

echo.
echo 1. Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 2. Verificando PostgreSQL...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL nao encontrado no PATH
    echo Tentando caminhos comuns...
    
    if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
        set "PSQL_PATH=C:\Program Files\PostgreSQL\15\bin"
        echo PostgreSQL encontrado em: %PSQL_PATH%
    ) else if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
        set "PSQL_PATH=C:\Program Files\PostgreSQL\17\bin"
        echo PostgreSQL encontrado em: %PSQL_PATH%
    ) else if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
        set "PSQL_PATH=C:\Program Files\PostgreSQL\17\bin"
        echo PostgreSQL encontrado em: %PSQL_PATH%
    ) else (
        echo ERRO: PostgreSQL nao encontrado!
        echo Instale o PostgreSQL em: https://www.postgresql.org/download/windows/
        pause
        exit /b 1
    )
) else (
    set "PSQL_PATH=psql"
)

echo.
echo 3. Configurando senha do PostgreSQL...
set PGPASSWORD=SA.2@.nj--

echo.
echo 4. Criando banco de dados...
"%PSQL_PATH%\psql.exe" -U postgres -h localhost -c "CREATE DATABASE gerenciador_eventos;" 2>nul
if %errorlevel% neq 0 (
    echo ERRO: Nao foi possivel criar o banco de dados
    echo Verifique se o PostgreSQL esta rodando e a senha esta correta
    pause
    exit /b 1
)

echo.
echo 5. Instalando dependencias do backend...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do backend
    pause
    exit /b 1
)

echo.
echo 6. Instalando dependencias do frontend...
cd ..\frontend
npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do frontend
    pause
    exit /b 1
)

echo.
echo 7. Configurando arquivos .env...
cd ..\backend
if not exist .env (
    echo Criando .env do backend...
    echo DATABASE_URL=postgresql://postgres:SA.2%%40.nj--@localhost:5432/gerenciador_eventos > .env
    echo JWT_SECRET=sua_chave_jwt_super_secreta_aqui_para_desenvolvimento >> .env
    echo NODE_ENV=development >> .env
    echo PORT=5000 >> .env
    echo FRONTEND_URL=http://localhost:3000 >> .env
    echo UPLOAD_PATH=./uploads >> .env
    echo MAX_FILE_SIZE=104857600 >> .env
)

cd ..\frontend
if not exist .env (
    echo Criando .env do frontend...
    echo REACT_APP_API_URL=http://localhost:5000/api > .env
    echo REACT_APP_SOCKET_URL=http://localhost:5000 >> .env
)

echo.
echo 8. Executando migracoes...
cd ..\backend
npx prisma migrate deploy
npx prisma generate

echo.
echo ========================================
echo Configuracao concluida!
echo ========================================
echo.
echo Para executar o sistema:
echo.
echo Terminal 1 (Backend):
echo cd backend
echo npm run dev
echo.
echo Terminal 2 (Frontend):
echo cd frontend
echo npm start
echo.
echo Acesse: http://localhost:3000
echo.
pause 