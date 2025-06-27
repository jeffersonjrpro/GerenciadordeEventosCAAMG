# 📋 Requisitos do Sistema - Gerenciador de Eventos QR Code

## 🎯 Visão Geral
Sistema completo de gerenciamento de eventos com confirmação de presença via QR Code, desenvolvido como plataforma SaaS com suporte a múltiplas empresas e organizadores.

## 🏢 Sistema SaaS Multi-Empresa

### ✅ Painel Administrativo Master
- **Dashboard Master** com indicadores de alto nível
- **Gestão de Empresas** (criar, editar, bloquear)
- **Sistema de Planos** (criar, editar, associar)
- **Gestão de Faturas** (criar, listar, marcar como pagas)
- **Controle de Administradores** (criar, editar, níveis de acesso)
- **Logs de Ações** (auditoria completa)

### ✅ Sistema de Planos e Faturas
- **Planos Configuráveis:**
  - Nome, preço, descrição
  - Limites: eventos, convidados, usuários
  - Associação a empresas
- **Faturas Automáticas:**
  - Geração mensal automática
  - Status: PAGO, PENDENTE, VENCIDA
  - Download em PDF
  - Processamento de pagamentos

## 💳 Sistema de Planos e Faturas (Usuário)

### ✅ Visualização do Plano
- Detalhes completos do plano atual
- Limites de eventos e convidados
- Preço mensal e descrição
- Opção para alterar plano

### ✅ Gestão de Faturas
- Histórico completo de faturas
- Status visual (Pago, Pendente, Vencida)
- Pagamento de faturas pendentes
- Download de faturas
- Resumo financeiro por status

### ✅ Interface Moderna
- Cards coloridos para diferentes status
- Gráficos de resumo financeiro
- Filtros e busca
- Notificações de sucesso/erro

## 👥 Sistema de Gerenciamento de Equipe

### ✅ Gestão de Usuários
- **Adicionar Usuários:**
  - Nome, email, telefone
  - Nível de acesso configurável
  - Seleção de eventos específicos ou todos
  - Geração automática de senha temporária
- **Editar Usuários:**
  - Modificar dados pessoais
  - Alterar nível de acesso
  - Configurar acesso a eventos
- **Remover Usuários:**
  - Soft delete (desativar)
  - Validações de segurança
- **Visualizar Usuários:**
  - Detalhes completos
  - Status ativo/inativo
  - Eventos associados

### ✅ Níveis de Acesso
- **Check-in:** Apenas fazer check-in nos eventos
- **Editor:** Editor de página + check-in
- **Administrador:** Acesso total à empresa
- **Proprietário:** Dono da empresa (não pode ser removido)

### ✅ Controle de Eventos
- **Todos os Eventos:** Acesso completo a todos os eventos da empresa
- **Eventos Específicos:** Seleção múltipla de eventos específicos
- **Validação:** Verificação de permissões em tempo real

### ✅ Filtros e Busca
- Filtrar por nome, email, nível e status
- Busca em tempo real
- Limpar filtros
- Ordenação por data de criação

### ✅ Segurança
- Validações de permissão por nível
- Geração automática de senhas seguras
- Soft delete para remoção
- Logs de ações administrativas

## 👥 Sistema de Organizadores Multiplos

### ✅ Convites para Organizadores
- Envio de convites por email
- Sistema de aceitação/rejeição
- Notificações automáticas
- Tokens únicos e seguros

### ✅ Gestão de Equipe
- Adicionar/remover organizadores
- Definir níveis de permissão
- Visualizar organizadores ativos
- Histórico de convites

### ✅ Controle de Acesso
- Diferentes níveis de permissão
- Acesso compartilhado a eventos
- Logs de atividades
- Validação de permissões

## 🎯 Sistema de Eventos

### ✅ CRUD de Eventos
- Criar, editar, visualizar, excluir eventos
- Upload de imagens
- Campos personalizados
- Configurações avançadas

### ✅ Sistema de QR Code
- Geração de QR Code único por convidado
- Códigos simples (4 letras + número)
- Download de QR Code
- Validação de segurança CSP

### ✅ Check-in
- Leitura de QR Code
- Código manual
- Interface clara e responsiva
- Validação em tempo real

### ✅ Dashboard
- Estatísticas em tempo real
- Gráficos de participação
- Indicadores de performance
- Exportação de dados

### ✅ Convidados
- Importação via CSV
- Exportação de dados
- Campos personalizados
- Histórico de check-ins

### ✅ Eventos Públicos
- Formulário de inscrição
- Controle de inscrições
- Pausar/retomar inscrições
- Validação de dados

## 🎨 Construtor de Formulários

### ✅ Interface Drag & Drop
- Arrastar e soltar campos
- Configuração visual
- Preview em tempo real
- Validação de campos

### ✅ Tipos de Campo
- Texto, email, telefone
- Data, número, seleção
- Checkbox, radio button
- Textarea, arquivo

### ✅ Configurações
- Campos obrigatórios
- Validações personalizadas
- Ordenação de campos
- Temas e cores

## 🎨 Editor de Página Pública

### ✅ Personalização Visual
- Temas e cores customizáveis
- Layout responsivo
- Editor de texto rico
- Preview em tempo real

### ✅ Configurações
- Logo da empresa
- Cores personalizadas
- Textos e descrições
- Campos de formulário

### ✅ Código de Incorporação
- Embed em sites externos
- Configuração de tamanho
- Responsividade
- Integração fácil

## 🎯 Sistema de SubEventos

### ✅ Gestão de SubEventos
- Criar subeventos dentro de eventos principais
- Configurar data, hora e local
- Definir limite por convidado
- Controle de acesso

### ✅ Controle de Consumo
- Validação via QR Code
- Limite por convidado
- Feedback visual
- Bloqueio automático

### ✅ Relatórios
- Estatísticas detalhadas
- Convidados sem consumo
- Exportação CSV
- Gráficos de uso

## 🛠️ Requisitos Técnicos

### Backend
- **Node.js 18+** com Express.js
- **PostgreSQL 12+** com Prisma ORM
- **JWT Authentication** para segurança
- **QR Code generation** (qrcode)
- **Email integration** (nodemailer)
- **File upload** (multer)
- **Validation** (express-validator)
- **CORS** (cors)
- **Rate limiting** (express-rate-limit)
- **Helmet** para segurança e CSP

### Frontend
- **React 18** com React Router v6
- **TailwindCSS** para estilização
- **QR Code Scanner** (react-qr-reader)
- **React Hook Form** com Yup validation
- **Axios** para requisições HTTP
- **React Icons** e **Lucide React**
- **@heroicons/react** para dashboards
- **React Hot Toast** para notificações
- **@dnd-kit** para drag & drop
- **React Colorful** para seleção de cores
- **React-Quill** para edição de texto rica

### Banco de Dados
- **PostgreSQL** como banco principal
- **Prisma** como ORM
- **Migrações** automáticas
- **Seeds** para dados iniciais

### Segurança
- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Helmet** para headers de segurança
- **Rate limiting** para proteção
- **CORS** configurado
- **Validação** de dados

## 📱 Interface e UX

### ✅ Design Responsivo
- Mobile-first approach
- Breakpoints para diferentes telas
- Navegação otimizada
- Touch-friendly

### ✅ Componentes Modernos
- Cards e modais
- Formulários intuitivos
- Feedback visual
- Loading states

### ✅ Navegação
- Menu lateral responsivo
- Breadcrumbs
- Filtros avançados
- Busca em tempo real

### ✅ Notificações
- Toast notifications
- Alertas de sucesso/erro
- Confirmações de ações
- Feedback de loading

## 🔧 Configuração e Deploy

### ✅ Variáveis de Ambiente
- Configuração de banco de dados
- Chaves JWT
- Configuração de email
- URLs de produção

### ✅ Scripts de Deploy
- Build automatizado
- Migrações de banco
- Seeds de dados
- Health checks

### ✅ Monitoramento
- Logs de aplicação
- Logs de banco de dados
- Métricas de performance
- Alertas de erro

## 📊 Métricas e Analytics

### ✅ Dashboard Master
- Total de empresas ativas
- Total de usuários ativos
- Eventos criados no mês
- Faturas pendentes e pagas
- Receita total por mês

### ✅ Dashboard de Eventos
- Convidados confirmados
- Check-ins realizados
- Taxa de participação
- Performance por evento

### ✅ Relatórios
- Exportação CSV
- Gráficos interativos
- Filtros avançados
- Comparativos temporais

## 🔮 Funcionalidades Futuras

### 💡 Integrações
- Gateway de pagamento (Stripe, PagSeguro)
- WhatsApp Business API
- Google Calendar
- Microsoft Teams

### 💡 Melhorias
- App mobile nativo
- Notificações push
- IA para sugestões
- Analytics avançados

### 💡 Recursos
- Streaming de eventos
- Certificados automáticos
- Gamificação
- Marketplace de templates

## 🆕 Melhorias e Diferenciais Recentes

- Inclusão e edição de convidados com campos personalizados dinâmicos e QR Code
- Campos personalizados criados no evento aparecem imediatamente ao adicionar/editar convidados
- Formulário de convidados moderno, responsivo e com download de QR Code
- Construtor de formulários drag & drop com edição fluida do rótulo dos campos
- Separação clara da edição de senha no perfil do usuário
- Correções de UX e responsividade em todas as telas 