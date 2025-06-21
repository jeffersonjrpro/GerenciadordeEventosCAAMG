# 🎉 Gerenciador de Eventos - Sistema QR Code

Sistema completo de gerenciamento de eventos com confirmação de presença via QR Code, desenvolvido para o CAAMG.

## 🚀 Funcionalidades

- ✅ CRUD completo de usuários e eventos
- ✅ Sistema de convites com QR Code único
- ✅ Check-in via leitura de QR Code
- ✅ Dashboard com estatísticas em tempo real
- ✅ Envio de convites por email
- ✅ Interface responsiva e moderna com TailwindCSS
- ✅ Autenticação JWT segura
- ✅ Exportação de dados (CSV)
- ✅ Importação de convidados via CSV
- ✅ Controle de inscrições (pausar/retomar)
- ✅ Eventos públicos com formulário de inscrição
- ✅ Upload de imagens para eventos
- ✅ Campos personalizados para eventos
- ✅ Sistema de permissões (Admin/Organizador)

## 🛠️ Tecnologias

### Backend
- **Node.js 18+** + Express.js
- **PostgreSQL** + Prisma ORM
- **JWT Authentication**
- **QR Code generation** (qrcode)
- **Email integration** (nodemailer)
- **File upload** (multer)
- **Validation** (express-validator)
- **CORS** (cors)
- **Rate limiting** (express-rate-limit)

### Frontend
- **React 18** + React Router v6
- **TailwindCSS** + PostCSS
- **QR Code Scanner** (react-qr-reader)
- **React Hook Form** + Yup validation
- **Axios** para requisições HTTP
- **React Icons**
- **React Hot Toast** para notificações

## 📦 Instalação Completa

### Pré-requisitos
- **Node.js 18+** (recomendado: v20+)
- **PostgreSQL 12+**
- **npm** ou **yarn**
- **Git**

### 1. Clone o repositório
```bash
git clone https://github.com/jeffersonjrpro/GerenciadordeEventosCAAMG.git
cd GerenciadordeEventosCAAMG
```

### 2. Instale as dependências do Backend
```bash
cd backend
npm install
```

**Dependências do Backend:**
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "express-validator": "^7.0.1",
  "multer": "^1.4.5-lts.1",
  "qrcode": "^1.5.3",
  "nodemailer": "^6.9.7",
  "prisma": "^5.7.1",
  "@prisma/client": "^5.7.1",
  "dotenv": "^16.3.1",
  "csv-parser": "^3.0.0",
  "csv-writer": "^1.6.0"
}
```

### 3. Instale as dependências do Frontend
```bash
cd ../frontend
npm install
```

**Dependências do Frontend:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.1",
  "react-hook-form": "^7.48.2",
  "react-qr-reader": "^3.0.0-beta-1",
  "axios": "^1.6.2",
  "react-hot-toast": "^2.4.1",
  "react-icons": "^4.12.0",
  "tailwindcss": "^3.3.6",
  "postcss": "^8.4.32",
  "autoprefixer": "^10.4.16"
}
```

### 4. Configure o banco de dados PostgreSQL
```sql
-- Crie o banco de dados
CREATE DATABASE eventos_caamg;

-- Crie um usuário (opcional)
CREATE USER eventos_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE eventos_caamg TO eventos_user;
```

### 5. Configure as variáveis de ambiente

**Backend (.env):**
```env
# Database
DATABASE_URL="postgresql://eventos_user:sua_senha@localhost:5432/eventos_caamg"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura-aqui"

# Email (Nodemailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASS="sua-senha-de-app"

# Server
PORT=3001
NODE_ENV=development

# Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_BASE_URL=http://localhost:3000
```

### 6. Execute as migrações do banco
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 7. Crie o usuário administrador
```bash
cd backend
node create-admin.js
```

### 8. Inicie o desenvolvimento

**Opção 1: Iniciar separadamente**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

**Opção 2: Iniciar tudo junto (raiz do projeto)**
```bash
npm run dev
```

## 🌐 Acesso ao Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Documentação API**: http://localhost:3001/api/docs

## 👤 Primeiro Acesso

1. **Login inicial:**
   - Email: `admin@caamg.com`
   - Senha: `admin123`

2. **Criar conta:** Registre-se com seu email
3. **Criar evento:** Adicione detalhes do evento
4. **Adicionar convidados:** Importe via CSV ou adicione manualmente
5. **Compartilhar:** Use os links públicos para divulgação

## 📱 Funcionalidades Principais

### Para Organizadores
- ✅ Criar e gerenciar eventos
- ✅ Adicionar/importar convidados
- ✅ Controlar inscrições (pausar/retomar)
- ✅ Visualizar estatísticas em tempo real
- ✅ Exportar dados dos convidados
- ✅ Tornar eventos públicos/privados

### Para Convidados
- ✅ Acessar eventos públicos
- ✅ Inscrever-se via formulário
- ✅ Receber QR Code único
- ✅ Confirmar presença via QR Code

### Para Administradores
- ✅ Gerenciar todos os usuários
- ✅ Visualizar todos os eventos
- ✅ Acessar estatísticas globais
- ✅ Configurar sistema

## 🎯 Estrutura do Projeto

```
GerenciadordeEventosCAAMG/
├── backend/                    # API REST
│   ├── src/
│   │   ├── controllers/        # Controladores
│   │   ├── routes/            # Rotas da API
│   │   ├── services/          # Lógica de negócio
│   │   ├── middleware/        # Middlewares
│   │   └── config/            # Configurações
│   ├── prisma/                # Schema e migrações
│   ├── uploads/               # Arquivos enviados
│   └── temp/                  # Arquivos temporários
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── contexts/          # Contextos React
│   │   ├── services/          # Serviços de API
│   │   └── hooks/             # Hooks customizados
│   └── public/                # Arquivos públicos
├── docs/                       # Documentação
└── scripts/                    # Scripts de automação
```

## 🔧 Scripts Disponíveis

### Backend
```bash
npm start              # Inicia em produção
npm run dev            # Inicia em desenvolvimento
npm run build          # Build de produção
npx prisma studio      # Interface visual do banco
npx prisma migrate dev # Executa migrações
```

### Frontend
```bash
npm start              # Inicia servidor de desenvolvimento
npm run build          # Build de produção
npm run test           # Executa testes
npm run eject          # Eject do Create React App
```

### Raiz do Projeto
```bash
npm run dev            # Inicia backend e frontend
npm run install:all    # Instala todas as dependências
npm run build:all      # Build de produção completo
```

## 🚨 Solução de Problemas

### Erro de Porta em Uso
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
# Windows: Services > PostgreSQL
# Linux: sudo systemctl status postgresql
```

### Erro de Dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📊 Funcionalidades Futuras

- [ ] Integração com WhatsApp Business API
- [ ] Sistema de pagamentos (PIX, cartão)
- [ ] Formulários customizáveis avançados
- [ ] Suporte a múltiplos organizadores por evento
- [ ] Exportação avançada (Excel, PDF, relatórios)
- [ ] Widget para embed em outros sites
- [ ] App mobile (React Native)
- [ ] Sistema de notificações push
- [ ] Backup automático do banco
- [ ] Dashboard administrativo avançado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Desenvolvido por

**Jefferson Jr** - Desenvolvedor Full Stack

- GitHub: [@jeffersonjrpro](https://github.com/jeffersonjrpro)
- Email: contato@jeffersonjr.dev

## 🙏 Agradecimentos

- CAAMG - Centro Acadêmico de Administração e Gestão
- Comunidade React e Node.js
- Contribuidores do projeto 