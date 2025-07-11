# 🚀 Instalação do Sistema de Gerenciamento de Eventos

## 📋 Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **PostgreSQL** (banco de dados)
- **Acesso ao servidor de arquivos** (10.10.5.6)

## 🛠️ Instalação Automática

### Windows
```bash
# Execute o script de instalação
setup_servidor.bat
```

### Linux/Mac
```bash
# Torne o script executável
chmod +x setup_servidor.sh

# Execute o script de instalação
./setup_servidor.sh
```

## 📝 Configuração Manual

### 1. Backend (.env)
```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"

# JWT
JWT_SECRET="sua_chave_secreta_aqui"

# Servidor
PORT=5000
NODE_ENV=production

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha
```

### 2. Frontend (.env)
```env
# API Backend
REACT_APP_API_URL=http://localhost:5000

# Proxy (para desenvolvimento)
REACT_APP_PROXY=http://localhost:5000
```

## 🔧 Instalação Manual

### 1. Backend
```bash
cd backend
npm install
npx prisma generate
npm start
```

### 2. Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

## 📁 Servidor de Arquivos

O sistema está configurado para salvar arquivos no servidor SMB:

- **Servidor**: caafiles-v
- **Pasta**: App_Eventos
- **Usuário**: eventos
- **Domínio**: caamg
- **Senha**: Caa.@silver25

### Teste de Conexão
```bash
# No frontend, clique no botão "Testar Conexão" na seção de arquivos
# Ou execute no backend:
cd backend
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
        console.log('❌ Erro:', err.message);
    } else {
        console.log('✅ Conexão OK!');
    }
    smbClient.close();
});
"
```