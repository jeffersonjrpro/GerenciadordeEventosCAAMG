# Sistema de Múltiplos Organizadores - Gerenciador de Eventos

## 📋 Visão Geral

Este sistema permite que múltiplos usuários colaborem na organização de eventos, com diferentes níveis de permissão e controle granular sobre as ações que cada organizador pode realizar.

## 🏗️ Arquitetura

### Modelos de Dados

#### 1. Company (Empresa)
```prisma
model Company {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users  User[]
  events Event[]
}
```

#### 2. User (Usuário)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(ORGANIZER)
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  
  // Eventos criados pelo usuário
  events Event[]
  
  // Organizadores de eventos
  eventOrganizers EventOrganizer[]
  
  // Convites enviados
  sentInvites TeamInvite[]
}
```

#### 3. Event (Evento)
```prisma
model Event {
  id          String   @id @default(cuid())
  name        String
  description String?
  date        DateTime
  location    String
  // ... outros campos
  
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  
  // Criador do evento
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Organizadores do evento
  organizers EventOrganizer[]
  
  // Convites da equipe
  teamInvites TeamInvite[]
}
```

#### 4. EventOrganizer (Organizador de Evento)
```prisma
model EventOrganizer {
  id        String   @id @default(cuid())
  role      OrganizerRole @default(EDITOR)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  eventId  String
  event    Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
}
```

#### 5. TeamInvite (Convite da Equipe)
```prisma
model TeamInvite {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  role      OrganizerRole @default(EDITOR)
  status    InviteStatus @default(PENDING)
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  eventId String
  event   Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  invitedById String
  invitedBy   User     @relation(fields: [invitedById], references: [id], onDelete: Cascade)
}
```

### Enums

```prisma
enum UserRole {
  ADMIN
  ORGANIZER
}

enum OrganizerRole {
  OWNER    // Dono do evento (pode fazer tudo)
  EDITOR   // Editor (pode criar, editar, fazer check-in)
  CHECKIN  // Apenas check-in
}

enum InviteStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}
```

## 🔐 Sistema de Permissões

### Hierarquia de Papéis

1. **OWNER (Dono)**
   - Controle total sobre o evento
   - Pode deletar o evento
   - Pode gerenciar todos os organizadores
   - Pode fazer todas as ações de EDITOR e CHECKIN

2. **EDITOR (Editor)**
   - Pode criar, editar e fazer check-in
   - Pode gerenciar convidados
   - Pode configurar formulários e páginas
   - Pode convidar novos organizadores
   - Pode pausar/retomar inscrições

3. **CHECKIN (Check-in)**
   - Apenas pode fazer check-in de convidados
   - Pode visualizar dados do evento
   - Não pode fazer alterações

### Verificação de Permissões

```javascript
// Exemplo de verificação de permissão
const hasPermission = await OrganizerService.hasPermission(eventId, userId, 'EDITOR');
if (!hasPermission) {
  return res.status(403).json({
    error: 'Sem permissão para editar este evento'
  });
}
```

## 📧 Sistema de Convites

### Fluxo de Convite

1. **Envio do Convite**
   - Organizador com papel EDITOR ou superior pode convidar
   - Sistema gera token único válido por 48 horas
   - E-mail é enviado com link contendo o token

2. **Validação do Convite**
   - Sistema verifica se o token é válido
   - Verifica se o convite não expirou
   - Verifica se o convite não foi usado

3. **Aceitação do Convite**
   - Usuário clica no link do convite
   - Se não tem conta, é redirecionado para cadastro
   - Se tem conta, aceita o convite e é adicionado como organizador

### Estrutura do Token

```javascript
// Geração do token
const token = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 horas
```

## 🛠️ APIs Implementadas

### Rotas de Organizadores

```javascript
// Enviar convite
POST /api/organizers/events/:eventId/invite

// Listar organizadores
GET /api/organizers/events/:eventId/organizers

// Remover organizador
DELETE /api/organizers/events/:eventId/organizers/:userId

// Atualizar papel
PUT /api/organizers/events/:eventId/organizers/:userId/role

// Validar convite
GET /api/organizers/invite/:token

// Aceitar convite
POST /api/organizers/invite/:token/accept

// Rejeitar convite
POST /api/organizers/invite/:token/decline

// Listar convites pendentes
GET /api/organizers/events/:eventId/invites

// Cancelar convite
DELETE /api/organizers/invites/:inviteId

// Eventos organizados pelo usuário
GET /api/organizers/my-organized-events
```

### Rotas de Empresas

```javascript
// Criar empresa
POST /api/organizers/companies

// Adicionar usuário à empresa
POST /api/organizers/users/:userId/company

// Listar usuários da empresa
GET /api/organizers/companies/:companyId/users
```

## 🎨 Frontend

### Componentes Principais

#### 1. EventTeam
- Gerencia a equipe de organizadores de um evento
- Permite enviar convites
- Lista organizadores atuais e convites pendentes
- Permite remover organizadores e atualizar papéis

#### 2. InviteAccept
- Página para aceitar/rejeitar convites
- Valida o token do convite
- Mostra informações do evento e do convite

### Integração na Página de Detalhes

A seção de equipe foi integrada na página de detalhes do evento (`EventDetails.js`), permitindo que organizadores gerenciem a equipe diretamente na interface do evento.

## 🔄 Migração de Dados

### Script de Migração

O arquivo `migrate-organizers.js` foi criado para migrar dados existentes:

1. **Criação de Empresa Padrão**
   - Cria uma empresa padrão se não existir
   - Associa usuários e eventos existentes à empresa padrão

2. **Adição de Organizadores**
   - Adiciona o criador de cada evento como organizador OWNER
   - Garante que todos os eventos tenham pelo menos um organizador

### Execução da Migração

```bash
cd backend
node migrate-organizers.js
```

## 🚀 Como Usar

### 1. Criar um Evento
- Ao criar um evento, o usuário automaticamente se torna organizador OWNER
- O evento é associado à empresa do usuário

### 2. Convidar Organizadores
- Na página de detalhes do evento, acesse a seção "Equipe do Evento"
- Clique em "Convidar Organizador"
- Preencha o e-mail e selecione a função
- O convite será enviado por e-mail

### 3. Aceitar Convite
- O convidado recebe um e-mail com link
- Clica no link e é direcionado para a página de aceitação
- Aceita o convite e se torna organizador do evento

### 4. Gerenciar Permissões
- Organizadores com papel EDITOR ou superior podem:
  - Remover outros organizadores
  - Alterar papéis de outros organizadores
  - Cancelar convites pendentes

## 🔒 Segurança

### Validações Implementadas

1. **Verificação de Permissão**
   - Todas as ações são validadas contra o papel do usuário
   - Middleware `organizerAuth.js` para verificação automática

2. **Proteção de Dados**
   - Usuários só veem eventos onde são organizadores
   - Verificação de propriedade da empresa

3. **Tokens Seguros**
   - Tokens de convite são únicos e expiram em 48 horas
   - Tokens são invalidados após uso

### Middleware de Autenticação

```javascript
// Exemplo de uso do middleware
router.put('/:eventId', isEventEditor, EventController.updateEvent);
router.delete('/:eventId', isEventOwner, EventController.deleteEvent);
router.post('/checkin', canCheckIn, CheckInController.performCheckIn);
```

## 📊 Logs e Auditoria

O sistema registra automaticamente:
- Criação de convites
- Aceitação/rejeição de convites
- Adição/remoção de organizadores
- Alterações de papel

## 🔮 Funcionalidades Futuras

### Planejadas
1. **Logs de Atividade**
   - Histórico completo de ações por organizador
   - Notificações de mudanças importantes

2. **Permissões Granulares**
   - Controle específico por funcionalidade
   - Permissões temporárias

3. **Integração com E-mail**
   - Templates personalizados de convite
   - Notificações automáticas

4. **Dashboard de Equipe**
   - Visão geral de todos os eventos da empresa
   - Estatísticas por organizador

## 🐛 Troubleshooting

### Problemas Comuns

1. **Convite não chega**
   - Verificar configuração de e-mail no EmailService
   - Verificar logs do servidor

2. **Erro de permissão**
   - Verificar se o usuário é organizador do evento
   - Verificar o papel do usuário

3. **Token inválido**
   - Verificar se o convite não expirou
   - Verificar se o token está correto

### Logs Úteis

```bash
# Verificar logs do servidor
tail -f backend/logs/app.log

# Verificar migração
node backend/migrate-organizers.js
```

## 📝 Notas de Implementação

- O sistema mantém compatibilidade com dados existentes
- Todos os eventos existentes foram migrados automaticamente
- A interface foi integrada de forma não-intrusiva
- O sistema é escalável para múltiplas empresas

---

**Desenvolvido com ❤️ para facilitar a colaboração em eventos** 