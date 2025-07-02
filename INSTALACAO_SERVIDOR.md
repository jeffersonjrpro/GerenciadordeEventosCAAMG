# 🚀 Guia de Instalação - Sistema de Eventos CAAMG

## 📋 Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Git** instalado
- **Portainer** (opcional, mas recomendado)
- **PostgreSQL** (se não usar Docker)

## 🔧 Instalação Rápida

### 1. Clonar o Repositório
```bash
git clone https://github.com/jeffersonjrpro/GerenciadordeEventosCAAMG.git
cd GerenciadordeEventosCAAMG
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp backend/.env.example backend/.env

# Editar as variáveis
nano backend/.env
```

**Variáveis obrigatórias:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/gerenciador_eventos
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
FRONTEND_URL=https://seusite.com
```

### 3. Executar com Docker Compose
```bash
# Subir todos os serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f backend
```

## 🗄️ Configuração do Banco de Dados

### Opção A: Banco Existente (PostgreSQL)
1. **Criar banco de dados:**
```sql
CREATE DATABASE gerenciador_eventos;
```

2. **Executar migrações:**
```bash
# Conectar ao banco
psql -U postgres -d gerenciador_eventos

# Executar migração completa
\i backend/migration_completa.sql
```

### Opção B: Banco via Docker (Recomendado)
O Docker Compose já configura o PostgreSQL automaticamente.

## 🔧 Configurações Específicas

### Para Traefik (Proxy Reverso)
```yaml
# docker-compose.traefik.yml
version: '3.8'
services:
  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.eventos-backend.rule=Host(`seusite.com`) && PathPrefix(`/api/`)"
      - "traefik.http.routers.eventos-backend.entrypoints=websecure"
      - "traefik.http.routers.eventos-backend.tls=true"
```

### Para Nginx
```nginx
# nginx/default.conf
upstream backend {
    server backend:3001;
}

server {
    listen 80;
    server_name seusite.com;
    
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📁 Estrutura de Arquivos

```
GerenciadordeEventosCAAMG/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── migration_completa.sql    # ← Migração manual
│   └── .env
├── frontend/
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── docker-compose.traefik.yml
└── INSTALACAO_SERVIDOR.md        # ← Este arquivo
```

## 🔍 Verificação da Instalação

### 1. Verificar Containers
```bash
docker ps
# Deve mostrar: postgres, backend, frontend
```

### 2. Verificar Logs
```bash
# Backend
docker logs gerenciador-eventos-caamg-backend-1

# Frontend
docker logs gerenciador-eventos-caamg-frontend-1
```

### 3. Testar API
```bash
curl http://localhost:3001/api/health
# Deve retornar: {"status":"OK","timestamp":"..."}
```

## 🚨 Troubleshooting

### Erro: "The table arquivos_demanda does not exist"
```bash
# Executar migração manual
docker exec -it gerenciador-eventos-caamg-postgres-1 bash
psql -U postgres -d gerenciador_eventos
\i /app/migration_completa.sql
```

### Erro: "X-Forwarded-For header"
- ✅ Já corrigido no código (trust proxy configurado)

### Erro: "Rate limit exceeded"
- Verificar configuração do proxy reverso
- Confirmar que `trust proxy` está ativo

## 📊 Funcionalidades Disponíveis

- ✅ **Gestão de Eventos** (criar, editar, deletar)
- ✅ **Sistema de Inscrições** (formulários personalizados)
- ✅ **Check-in com QR Code**
- ✅ **Gestão de Demandas** (com arquivamento)
- ✅ **Upload de Arquivos** (máximo 100MB)
- ✅ **Notificações Automáticas**
- ✅ **Sistema de Usuários e Permissões**
- ✅ **Relatórios e Estatísticas**

## 🔄 Atualizações

```bash
# Atualizar código
git pull origin main

# Reconstruir containers
docker-compose down
docker-compose up -d --build

# Executar migrações (se necessário)
docker exec -it gerenciador-eventos-caamg-postgres-1 bash
psql -U postgres -d gerenciador_eventos -c "\i /app/migration_completa.sql"
```

## 📞 Suporte

Para problemas ou dúvidas:
- Verificar logs: `docker-compose logs -f`
- Executar migrações manuais se necessário
- Verificar configurações de ambiente

---

**✅ Sistema pronto para produção!** 