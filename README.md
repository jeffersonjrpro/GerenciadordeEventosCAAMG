# 🎉 Gerenciador de Eventos - Sistema QR Code

Sistema completo de gerenciamento de eventos com confirmação de presença via QR Code.

## 🚀 Funcionalidades

- ✅ CRUD completo de usuários e eventos
- ✅ Sistema de convites com QR Code único
- ✅ Check-in via leitura de QR Code
- ✅ Dashboard com estatísticas
- ✅ Envio de convites por email
- ✅ Interface responsiva e moderna
- ✅ Autenticação segura
- ✅ Exportação de dados

## 🛠️ Tecnologias

### Backend
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication
- QR Code generation
- Email integration (SendGrid)

### Frontend
- React 18
- TailwindCSS
- React Router
- QR Code Scanner
- React Hook Form

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <repository-url>
cd gerenciador-eventos-qr
```

### 2. Instale as dependências
```bash
npm run install:all
```

### 3. Configure o banco de dados
```bash
# Crie um banco PostgreSQL
# Configure as variáveis de ambiente no arquivo .env
```

### 4. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/eventos_db"

# JWT
JWT_SECRET="sua-chave-secreta-aqui"

# Email (SendGrid)
SENDGRID_API_KEY="sua-api-key-sendgrid"
EMAIL_FROM="noreply@seusite.com"

# Server
PORT=3001
NODE_ENV=development
```

### 5. Execute as migrações
```bash
cd backend
npx prisma migrate dev
```

### 6. Inicie o desenvolvimento
```bash
npm run dev
```

O sistema estará disponível em:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📱 Uso

1. **Cadastro/Login**: Crie uma conta ou faça login
2. **Criar Evento**: Adicione detalhes do evento
3. **Convidados**: Adicione lista de convidados
4. **Enviar Convites**: Sistema gera QR Codes únicos
5. **Check-in**: Use a câmera para ler QR Codes no evento

## 🎯 Estrutura do Projeto

```
├── backend/           # API REST
│   ├── controllers/   # Controladores
│   ├── routes/        # Rotas da API
│   ├── services/      # Lógica de negócio
│   ├── models/        # Modelos Prisma
│   └── middleware/    # Middlewares
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
└── docs/              # Documentação
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia backend e frontend em desenvolvimento
- `npm run dev:backend` - Apenas backend
- `npm run dev:frontend` - Apenas frontend
- `npm run build` - Build de produção
- `npm run start` - Inicia em produção

## 📊 Funcionalidades Futuras

- [ ] Integração com gateways de pagamento
- [ ] Formulários customizáveis
- [ ] Suporte a múltiplos usuários por conta
- [ ] Exportação avançada (Excel, PDF)
- [ ] Widget para outros sites

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes. 