# 🖥️ Configuração Local - Sistema de Eventos CAAMG

## 📋 Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **PostgreSQL** (já instalado na sua máquina)
- **Git**

## 🔧 Passo a Passo

### 1. **Verificar PostgreSQL Local**

```bash
# Verificar se o PostgreSQL está rodando
psql --version

# Conectar ao PostgreSQL
psql -U postgres -h localhost
```

### 2. **Criar Banco de Dados**

```sql
-- No PostgreSQL
CREATE DATABASE gerenciador_eventos;
\q
```

### 3. **Configurar Backend**

```bash
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env
```

### 4. **Editar .env do Backend**

Crie o arquivo `backend/.env` com:

```env
# Configurações do Banco de Dados
DATABASE_URL=postgresql://postgres:SA.2%40.nj--@localhost:5432/gerenciador_eventos

# Configurações do JWT
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_para_desenvolvimento

# Configurações do Servidor
NODE_ENV=development
PORT=5000

# Configurações de Email (opcional para desenvolvimento)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# URL do Frontend
FRONTEND_URL=http://localhost:3000

# Configurações de Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=104857600
```

### 5. **Executar Migrações**

```bash
# No diretório backend
npx prisma migrate deploy
npx prisma generate
```

### 6. **Configurar Frontend**

```bash
# Voltar para a raiz do projeto
cd ..

# Entrar na pasta do frontend
cd frontend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env
```

### 7. **Editar .env do Frontend**

Crie o arquivo `frontend/.env` com:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 8. **Executar o Sistema**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 🌐 Acessar o Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 📝 Primeiro Acesso

1. Acesse http://localhost:3000
2. Crie uma conta de administrador
3. Configure sua empresa
4. Comece a usar o sistema!

## 🔧 Comandos Úteis

```bash
# Verificar status do banco
npx prisma studio

# Resetar banco (cuidado!)
npx prisma migrate reset

# Ver logs do backend
npm run dev

# Build do frontend
npm run build
```

## 🐛 Solução de Problemas

**Se der erro de banco:**
```bash
# Recriar banco
npx prisma migrate reset --force
```

**Se der erro de dependências:**
```bash
# Limpar cache
npm cache clean --force
rm -rf node_modules
npm install
```

**Se der erro de porta:**
```bash
# Verificar portas em uso
lsof -i :3000
lsof -i :5000
```

## 📁 Estrutura de Pastas

```
GerenciadordeEventosCAAMG/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   ├── .env
│   └── package.json
├── setup_local.bat
├── restore_database.bat
└── CONFIGURACAO_LOCAL.md
```

## ✅ Checklist

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados criado
- [ ] Backend configurado (.env)
- [ ] Frontend configurado (.env)
- [ ] Migrações executadas
- [ ] Backend rodando (porta 5000)
- [ ] Frontend rodando (porta 3000)
- [ ] Sistema acessível via navegador

## 🚀 Scripts Automatizados

### **Configuração Inicial:**
```bash
# Executar configuração automática
.\setup_local.bat
```

### **Restaurar Backup:**
```bash
# Colocar arquivo gerenciador_eventos_backup.backup na pasta
# Executar restauração automática
.\restore_database.bat
``` 