# 🎉 Gerenciador de Eventos - Sistema QR Code

Sistema completo de gerenciamento de eventos com confirmação de presença via QR Code, desenvolvido para o CAAMG.

## 🚀 Funcionalidades

- ✅ CRUD completo de usuários e eventos
- ✅ Sistema de convites com QR Code único
- ✅ Check-in via leitura de QR Code e código manual
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
- ✅ **Construtor de Formulários Drag & Drop**
- ✅ **Editor de Página Pública Personalizável**
- ✅ **Código de Incorporação (Embed)**
- ✅ **Visualização em Tempo Real**
- ✅ **Temas e Cores Customizáveis**
- ✅ **Editor de Texto Rico (React-Quill)** para descrição de eventos
- ✅ **Geração de códigos únicos simples** (4 letras do evento + número)
- ✅ **Página de detalhes do convidado** com QR Code e informações completas
- ✅ **Download do QR Code** com configuração CSP adequada
- ✅ **Check-in por QR Code e código manual** com interface clara
- ✅ **Exportação e importação com campos personalizados**
- ✅ **Visualização detalhada de convidados** com histórico de check-ins
- ✅ **Sistema de check-in duplo** (QR Code + código manual)
- ✅ **Página de detalhes do convidado** com QR Code, status e histórico
- ✅ **Download de QR Code** com configuração de segurança CSP
- ✅ **Listagem de convidados** com campos personalizados e códigos QR

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
- **Helmet** para segurança e CSP

### Frontend
- **React 18** + React Router v6
- **TailwindCSS** + PostCSS
- **QR Code Scanner** (react-qr-reader)
- **React Hook Form** + Yup validation
- **Axios** para requisições HTTP
- **React Icons** + **Lucide React**
- **React Hot Toast** para notificações
- **@dnd-kit** para drag & drop
- **React Colorful** para seleção de cores
- **React-Quill** para edição de texto rica

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
  "qrcode": "^1.5.4",
  "nodemailer": "^6.9.7",
  "@sendgrid/mail": "^8.0.1",
  "prisma": "^5.6.0",
  "@prisma/client": "^5.6.0",
  "dotenv": "^16.3.1",
  "csv-parser": "^3.2.0",
  "csv-writer": "^1.6.0",
  "array-flatten": "^3.0.0",
  "moment": "^2.29.4",
  "pg": "^8.16.2",
  "uuid": "^9.0.1"
}
```

**DevDependencies do Backend:**
```json
{
  "nodemon": "^3.0.2"
}
```

### 3. Instale as dependências do Frontend
```bash
cd ../frontend
npm install
```

Se preferir, o comando `npm run install:all` na raiz do projeto instala tudo de uma vez. As dependências do frontend já incluem pacotes para o editor de texto (`react-quill`) e para uma melhor estilização de conteúdo (`@tailwindcss/typography`).

**Dependências do Frontend:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.1",
  "react-hook-form": "^7.48.2",
  "react-qr-reader": "^3.0.0-beta-1",
  "qrcode.react": "^3.1.0",
  "axios": "^1.6.2",
  "react-hot-toast": "^2.4.1",
  "react-datepicker": "^4.25.0",
  "date-fns": "^2.30.0",
  "lucide-react": "^0.294.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0",
  "ajv": "^8.17.1",
  "ajv-keywords": "^5.1.0",
  "react-dev-utils": "^12.0.1",
  "web-vitals": "^2.1.4",
  "@testing-library/jest-dom": "^5.17.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/user-event": "^14.5.2",
  "react-scripts": "5.0.1",
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "@dnd-kit/modifiers": "^9.0.0",
  "react-colorful": "^5.6.1",
  "react-quill": "^2.0.0"
}
```

**DevDependencies do Frontend:**
```json
{
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

# Email (SendGrid - alternativo)
SENDGRID_API_KEY="sua-api-key-sendgrid"
EMAIL_FROM="noreply@seusite.com"

# Server
PORT=3001
NODE_ENV=development

# Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880

# CORS (opcional)
ALLOWED_ORIGINS="http://localhost:3000,https://seusite.com"

# Rate Limiting (opcional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_BASE_URL=http://localhost:3000
```

### 6. Configure o TailwindCSS (Frontend)
```bash
cd frontend
npx tailwindcss init -p
```

O arquivo `tailwind.config.js` já está configurado com:
- Cores personalizadas (primary, success, warning, danger)
- Animações customizadas
- Fonte Inter
- Configurações de responsividade

### 7. Execute as migrações do banco
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 8. Crie o usuário administrador
```bash
cd backend
node create-admin.js
```

### 9. Inicie o desenvolvimento

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
- ✅ **Construtor de Formulários Drag & Drop**
- ✅ **Editor de Página Pública**
- ✅ **Campos Personalizados Avançados**
- ✅ **Código de Incorporação (Embed)**

### Para Convidados
- ✅ Acessar eventos públicos
- ✅ Inscrever-se via formulário customizado
- ✅ Receber QR Code único
- ✅ Confirmar presença via QR Code

### Para Administradores
- ✅ Gerenciar todos os usuários
- ✅ Visualizar todos os eventos
- ✅ Acessar estatísticas globais
- ✅ Configurar sistema

## 🎨 Novas Funcionalidades

### Construtor de Formulários
- **Drag & Drop**: Arraste campos para reordenar
- **Tipos de Campo**: Texto, Email, Telefone, Número, Data, Checkbox
- **Propriedades**: Rótulo, Placeholder, Obrigatório
- **Visualização**: Preview em tempo real
- **Configurações**: Título, descrição, mensagens personalizadas
- **Campos Personalizados**: Integração com campos customizados do evento

### Editor de Página Pública
- **Layout Moderno**: Design responsivo e profissional
- **Temas Customizáveis**: Cores primárias, secundárias, fundo e texto
- **Cabeçalho**: Título, subtítulo, imagem do evento
- **Conteúdo**: Data, local, descrição, organizador
- **Inscrição**: Formulário integrado, textos personalizados
- **Código Embed**: Incorporação em outros sites
- **Visualização**: Preview em iframe

### Campos Personalizados
- **Tipos Suportados**: Texto, Email, Número, Telefone, Data
- **Validação**: Campos obrigatórios opcionais
- **Integração**: Automática com formulários e listas
- **Flexibilidade**: Adicionar/remover conforme necessário

### Sistema de Check-in Avançado
- **Check-in Duplo**: QR Code + código manual (4 letras + número)
- **Interface Clara**: Opções visuais para ambos os métodos
- **Validação em Tempo Real**: Confirmação imediata do check-in
- **Histórico Completo**: Registro de todos os check-ins realizados
- **Códigos Únicos**: Geração automática de códigos simples e memoráveis

### Página de Detalhes do Convidado
- **Informações Completas**: Dados pessoais, campos personalizados, status
- **QR Code Visual**: Exibição do QR Code com opção de download
- **Histórico de Presença**: Status de confirmação e check-ins realizados
- **Informações do Evento**: Data, local e detalhes do evento
- **Download de QR Code**: Funcionalidade com configuração CSP adequada
- **Edição de Convidado**: Acesso rápido para editar informações

### Listagem de Convidados Melhorada
- **Campos Personalizados**: Exibição de campos customizados na tabela
- **Códigos QR**: Coluna com códigos QR clicáveis
- **Filtros Avançados**: Por status, presença e busca textual
- **Exportação Completa**: Inclui campos personalizados no CSV
- **Importação Inteligente**: Suporte a campos personalizados via CSV

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
│   │   │   ├── FormBuilder.js # Construtor de formulários
│   │   │   ├── FormField.js   # Campo de formulário
│   │   │   ├── FormPreview.js # Visualização de formulário
│   │   │   ├── FormSettings.js # Configurações de formulário
│   │   │   └── PublicPageEditor.js # Editor de página pública
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
npm run seed           # Popula banco com dados de teste
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

## ⚙️ Configurações Específicas

### Segurança
- **Helmet.js** para headers de segurança
- **CORS** configurado para desenvolvimento e produção
- **Rate Limiting** (comentado para desenvolvimento)
- **JWT** com expiração configurável
- **Bcrypt** para hash de senhas

### Upload de Arquivos
- **Multer** para upload de imagens
- **Validação** de tipos de arquivo
- **Limite** de tamanho configurável
- **Armazenamento** local em `/uploads`

### Banco de Dados
- **Prisma ORM** com PostgreSQL
- **Migrações** automáticas
- **Seed** para dados iniciais
- **Studio** para visualização
- **Campos JSON** para configurações de formulário e página

### Frontend
- **TailwindCSS** com configuração personalizada
- **React Router** com rotas protegidas
- **Context API** para estado global
- **Axios** com interceptors
- **React Hook Form** com validação
- **@dnd-kit** para drag & drop
- **React Colorful** para seleção de cores
- **Editor de Texto Rico (React-Quill)**

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
# Limpar cache e reinstale
rm -rf node_modules package-lock.json
npm install

# Para problemas com @dnd-kit
npm install --legacy-peer-deps
```

### Erro de Sintaxe no Backend
```bash
# Verificar sintaxe do JavaScript
cd backend
node -c src/controllers/eventController.js
```

## 🚀 Deploy em Produção

Para fazer o deploy em um servidor de produção, consulte o guia completo:

**[📖 Guia de Deploy](DEPLOY.md)**

### Resumo rápido:
1. **Configurar servidor** (Node.js, PostgreSQL, PM2)
2. **Configurar variáveis de ambiente** para produção
3. **Executar migrações** do banco
4. **Build do frontend** e configuração do Nginx
5. **Configurar SSL/HTTPS** com Let's Encrypt
6. **Configurar backup** automático

### Scripts de produção:
```bash
# Backend
npm run build        # Gera Prisma Client
npm run deploy       # Build + Start
pm2 start ecosystem.config.js  # Com PM2

# Frontend
npm run build        # Build de produção
```

## 📊 Funcionalidades Futuras

- [ ] Integração com WhatsApp Business API
- [ ] Sistema de pagamentos (PIX, cartão)
- [ ] Formulários customizáveis avançados (múltiplas páginas)
- [ ] Suporte a múltiplos organizadores por evento
- [ ] Exportação avançada (Excel, PDF, relatórios)
- [ ] Widget para embed em outros sites
- [ ] App mobile (React Native)
- [ ] Sistema de notificações push
- [ ] Backup automático do banco
- [ ] Dashboard administrativo avançado
- [ ] Templates de formulários pré-definidos
- [ ] Sistema de temas pré-configurados
- [ ] Analytics avançado de formulários

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