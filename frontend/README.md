# Frontend - Sistema de Gerenciamento de Eventos

Este é o frontend React do sistema de gerenciamento de eventos com confirmação de presença via QR Code.

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para construção de interfaces
- **React Router DOM** - Roteamento da aplicação
- **TailwindCSS** - Framework CSS utilitário
- **React Hook Form** - Gerenciamento de formulários
- **Axios** - Cliente HTTP para requisições à API
- **Lucide React** - Ícones modernos
- **React Hot Toast** - Notificações toast
- **QRCode React** - Geração de QR Codes
- **Date-fns** - Manipulação de datas

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout.js       # Layout principal da aplicação
│   └── PrivateRoute.js # Componente de rota protegida
├── contexts/           # Contextos React
│   └── AuthContext.js  # Contexto de autenticação
├── pages/              # Páginas da aplicação
│   ├── Login.js        # Página de login
│   ├── Register.js     # Página de registro
│   ├── Dashboard.js    # Dashboard principal
│   ├── Events.js       # Lista de eventos
│   ├── CreateEvent.js  # Criação de eventos
│   ├── EventDetails.js # Detalhes do evento
│   ├── EditEvent.js    # Edição de eventos
│   ├── Guests.js       # Gerenciamento de convidados
│   ├── CheckIn.js      # Check-in com QR Code
│   ├── Profile.js      # Perfil do usuário
│   └── PublicEvent.js  # Página pública do evento
├── services/           # Serviços e APIs
│   └── api.js         # Configuração do Axios
├── App.js             # Componente principal
└── index.js           # Ponto de entrada
```

## 🛠️ Instalação

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   REACT_APP_API_URL=http://localhost:3001
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

4. **Acesse a aplicação:**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📱 Funcionalidades Implementadas

### 🔐 Autenticação
- **Login** - Autenticação com email e senha
- **Registro** - Criação de nova conta
- **Proteção de rotas** - Acesso restrito a usuários autenticados

### 📊 Dashboard
- **Estatísticas** - Visão geral dos eventos e convidados
- **Eventos recentes** - Lista dos últimos eventos criados
- **Ações rápidas** - Links para funcionalidades principais

### 🎉 Gerenciamento de Eventos
- **Listagem** - Visualização de todos os eventos com filtros
- **Criação** - Formulário completo para criar novos eventos
- **Edição** - Modificação de eventos existentes
- **Detalhes** - Informações completas do evento
- **Exclusão** - Remoção de eventos

### 👥 Gerenciamento de Convidados
- **Listagem** - Visualização de convidados por evento
- **Adição** - Inclusão de novos convidados
- **Edição** - Modificação de dados dos convidados
- **Exclusão** - Remoção de convidados
- **Envio de convites** - Envio individual ou em massa
- **Exportação** - Download da lista em CSV

### 📱 Check-in
- **Scanner QR Code** - Leitura via webcam
- **Check-in manual** - Inserção manual do ID do convidado
- **Confirmação** - Feedback visual do resultado
- **Histórico** - Registro de presenças

### 🌐 Páginas Públicas
- **Visualização do evento** - Página pública para convidados
- **Registro de presença** - Formulário para confirmar presença
- **Compartilhamento** - Links para compartilhar eventos

### 👤 Perfil do Usuário
- **Informações pessoais** - Edição de nome e email
- **Alteração de senha** - Modificação da senha de acesso
- **Configurações** - Preferências da conta

## 🎨 Design System

### Cores
- **Primary** - Azul (#2563eb) - Ações principais
- **Success** - Verde (#16a34a) - Sucessos e confirmações
- **Warning** - Amarelo (#d97706) - Avisos e alertas
- **Danger** - Vermelho (#dc2626) - Erros e exclusões

### Componentes
- **Botões** - Primário, secundário, outline, danger
- **Cards** - Containers com header e body
- **Formulários** - Inputs, labels, validações
- **Badges** - Indicadores de status
- **Modais** - Diálogos e confirmações

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm build` - Gera build de produção
- `npm test` - Executa os testes
- `npm eject` - Ejeta a configuração do Create React App

## 🌐 Rotas da Aplicação

### Rotas Públicas
- `/login` - Página de login
- `/register` - Página de registro
- `/event/:eventId` - Página pública do evento
- `/event/:eventId/register` - Registro de presença

### Rotas Protegidas
- `/dashboard` - Dashboard principal
- `/events` - Lista de eventos
- `/events/create` - Criação de evento
- `/events/:eventId` - Detalhes do evento
- `/events/:eventId/edit` - Edição do evento
- `/events/:eventId/guests` - Gerenciamento de convidados
- `/events/:eventId/checkin` - Check-in
- `/profile` - Perfil do usuário

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- **Desktop** - Layout completo com sidebar
- **Tablet** - Layout adaptado para telas médias
- **Mobile** - Layout otimizado para smartphones

## 🔒 Segurança

- **Autenticação JWT** - Tokens para autenticação
- **Proteção de rotas** - Acesso restrito a usuários autenticados
- **Validação de formulários** - Validação client-side e server-side
- **Sanitização de dados** - Prevenção de XSS

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Variáveis de Ambiente para Produção
```env
REACT_APP_API_URL=https://sua-api.com
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](../LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para suporte@exemplo.com ou abra uma issue no repositório. 