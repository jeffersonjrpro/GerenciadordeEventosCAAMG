@echo off
echo ========================================
echo Restaurar Banco de Dados - Sistema CAAMG
echo ========================================

echo.
echo 1. Verificando arquivo de backup...
if not exist "gerenciador_eventos_backup.backup" (
    echo ERRO: Arquivo gerenciador_eventos_backup.backup nao encontrado!
    echo Coloque o arquivo de backup na mesma pasta deste script.
    pause
    exit /b 1
)

echo.
echo 2. Verificando PostgreSQL...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL nao encontrado no PATH
    echo Tentando caminhos comuns...
    
    if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
        set "PSQL_PATH=C:\Program Files\PostgreSQL\15\bin"
        echo PostgreSQL encontrado em: %PSQL_PATH%
    ) else if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
        set "PSQL_PATH=C:\Program Files\PostgreSQL\14\bin"
        echo PostgreSQL encontrado em: %PSQL_PATH%
    ) else if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
        set "PSQL_PATH=C:\Program Files\PostgreSQL\13\bin"
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
echo 4. Removendo banco existente (se houver)...
"%PSQL_PATH%\psql.exe" -U postgres -h localhost -c "DROP DATABASE IF EXISTS gerenciador_eventos;" 2>nul

echo.
echo 5. Criando novo banco de dados...
"%PSQL_PATH%\psql.exe" -U postgres -h localhost -c "CREATE DATABASE gerenciador_eventos;" 2>nul
if %errorlevel% neq 0 (
    echo ERRO: Nao foi possivel criar o banco de dados
    echo Verifique se o PostgreSQL esta rodando e a senha esta correta
    pause
    exit /b 1
)

echo.
echo 6. Restaurando backup...
"%PSQL_PATH%\pg_restore.exe" -U postgres -h localhost -d gerenciador_eventos gerenciador_eventos_backup.backup
if %errorlevel% neq 0 (
    echo ERRO: Falha ao restaurar o backup
    echo Verifique se o arquivo de backup esta correto
    pause
    exit /b 1
)

echo.
echo 7. Verificando restauracao...
"%PSQL_PATH%\psql.exe" -U postgres -h localhost -d gerenciador_eventos -c "SELECT COUNT(*) FROM users;"
"%PSQL_PATH%\psql.exe" -U postgres -h localhost -d gerenciador_eventos -c "SELECT COUNT(*) FROM events;"
"%PSQL_PATH%\psql.exe" -U postgres -h localhost -d gerenciador_eventos -c "SELECT COUNT(*) FROM demandas;"

echo.
echo ========================================
echo Restauracao concluida!
echo ========================================
echo.
echo Banco de dados restaurado com sucesso!
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