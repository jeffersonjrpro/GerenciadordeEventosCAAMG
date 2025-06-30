# 🚀 Guia de Instalação - Sistema de Eventos QR Code

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd gerenciador-eventos-qr
```

### 2. Instale as dependências
```bash
npm run install:all
```

Este comando irá instalar todas as dependências necessárias para o backend e frontend. Para o frontend, isso inclui os pacotes:
- `react-quill` para o editor de texto rico
- `@tailwindcss/typography` para a estilização do conteúdo gerado
- `@heroicons/react` para ícones modernos dos dashboards
- `lucide-react` para ícones adicionais
- `react-hot-toast` para notificações
- `@dnd-kit` para funcionalidades drag & drop
- `react-colorful` para seleção de cores
- `react-beautiful-dnd` para drag & drop adicional

### 3. Configure o banco de dados PostgreSQL

Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE eventos_db;
CREATE USER eventos_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE eventos_db TO eventos_user;
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta `backend/`:
```env
# Database
DATABASE_URL="postgresql://eventos_user:sua_senha@localhost:5432/eventos_db"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura-aqui-mude-esta-chave"

# Email (SendGrid) - Opcional para envio de convites
SENDGRID_API_KEY="sua-api-key-sendgrid"
EMAIL_FROM="noreply@seusite.com"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Rate Limiting (opcional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Crie também um arquivo `.env` na pasta `frontend/`. Ele é usado para definir a URL da sua API, mas não requer mais chaves de API para o editor de texto. Você pode copiar o exemplo:
```bash
# Navegue para a pasta do frontend se não estiver nela
cd frontend
cp .env.example .env
```
O conteúdo principal do `frontend/.env` deve ser:
```env
# URL da API Backend
REACT_APP_API_URL=http://localhost:3001/api
```

### 5. Execute as migrações do banco
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Inicie o desenvolvimento
```bash
# Na raiz do projeto
npm run dev
```

O sistema estará disponível em:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📱 Primeiro Acesso

### Para Usuários Normais:
1. Acesse http://localhost:3000
2. Clique em "Criar uma nova conta"
3. Preencha seus dados (incluindo nome da empresa e telefone)
4. Faça login
5. Crie seu primeiro evento!

### Para Administradores Master:
1. Acesse http://localhost:3000/admin/login
2. Use as credenciais master configuradas
3. Acesse o painel administrativo
4. Gerencie empresas, planos e faturas

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia backend e frontend
npm run dev:backend      # Apenas backend
npm run dev:frontend     # Apenas frontend

# Produção
npm run build           # Build do frontend
npm run start           # Inicia em produção

# Banco de dados
cd backend
npx prisma studio       # Interface visual do banco
npx prisma migrate dev  # Executa migrações
npx prisma generate     # Gera cliente Prisma
```

## 🗄️ Estrutura do Banco

O sistema cria automaticamente as seguintes tabelas:

### Tabelas Principais:
- `users` - Usuários do sistema
- `events` - Eventos criados
- `guests` - Convidados dos eventos
- `check_ins` - Registros de presença

### Tabelas SaaS:
- `empresas` - Empresas cadastradas
- `planos` - Planos de assinatura
- `faturas` - Faturas das empresas
- `admin_masters` - Administradores master
- `admin_logs` - Logs de ações administrativas

### Tabelas de Organização:
- `event_organizers` - Organizadores de eventos
- `team_invites` - Convites para equipe
- `sub_eventos` - Subeventos dentro de eventos
- `consumos` - Controle de consumo de subeventos

## 📧 Configuração de Email (Opcional)

Para enviar convites por email e notificações de equipe:

1. Crie uma conta no [SendGrid](https://sendgrid.com/)
2. Obtenha sua API Key
3. Configure no arquivo `.env`:
```env
SENDGRID_API_KEY=sua-api-key-aqui
EMAIL_FROM=seu-email@dominio.com
```

## 🔒 Segurança

- **JWT_SECRET**: Mude para uma chave única e segura
- **DATABASE_URL**: Use credenciais seguras
- **HTTPS**: Em produção, sempre use HTTPS
- **Rate Limiting**: Configurado para proteção contra ataques
- **CORS**: Configurado para segurança

## 🐛 Solução de Problemas

### Erro de conexão com banco
```bash
# Verifique se o PostgreSQL está rodando
# Verifique as credenciais no .env
# Teste a conexão:
cd backend
npx prisma db push
```

### Erro de porta em uso
```bash
# Mude a porta no .env
PORT=3002
```

### Erro de dependências
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Erro de migração
```bash
# Reset do banco (CUIDADO: apaga todos os dados)
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

## 📊 Funcionalidades Principais

### ✅ Sistema SaaS Multi-Empresa
- **Painel Administrativo Master** - Gestão centralizada
- **Sistema de Planos e Faturas** - Controle de assinaturas
- **Gestão de Empresas** - Criação, edição e bloqueio
- **Dashboard Master** - Indicadores de alto nível

### ✅ Sistema de Planos e Faturas (Usuário)
- **Visualização do Plano** - Detalhes completos
- **Gestão de Faturas** - Histórico e pagamentos
- **Interface Moderna** - Cards coloridos e gráficos

### ✅ Sistema de Gerenciamento de Equipe
- **Gestão de Usuários** - Adicionar, editar, remover
- **Níveis de Acesso** - Check-in, Editor, Administrador
- **Controle de Eventos** - Todos ou específicos
- **Filtros Avançados** - Busca e filtros

### ✅ Sistema de Eventos
- **Autenticação**: Login/Registro seguro
- **Eventos**: CRUD completo de eventos
- **Convidados**: Gerenciamento de lista de convidados
- **QR Code**: Geração automática de QR Codes únicos
- **RSVP**: Confirmação de presença pelos convidados
- **Check-in**: Leitura de QR Code para marcar presença
- **Dashboard**: Estatísticas e relatórios
- **Responsivo**: Interface adaptada para mobile

### ✅ Funcionalidades Avançadas
- **Construtor de Formulários** - Drag & drop
- **Editor de Página Pública** - Personalização visual
- **Sistema de SubEventos** - Controle de consumo
- **Organizadores Múltiplos** - Compartilhamento de eventos

## 🎯 Próximos Passos

1. Configure o email para envio de convites e notificações
2. Personalize o design conforme sua marca
3. Configure domínio personalizado
4. Implemente backup automático do banco
5. Configure monitoramento e logs
6. Integre gateway de pagamento para faturas
7. Implemente geração de PDF para faturas

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no repositório
- Consulte a documentação da API em `/api/health`
- Verifique os logs do sistema

---

**🎉 Sistema pronto para uso!**

### 🚀 Acessos Disponíveis:
- **Frontend Principal**: http://localhost:3000
- **Painel Admin Master**: http://localhost:3000/admin
- **API Backend**: http://localhost:3001/api
- **Prisma Studio**: http://localhost:5555 (após executar `npx prisma studio`) 