# 🚀 Deploy com Traefik - Gerenciador de Eventos

Este guia te ajudará a instalar o **Gerenciador de Eventos** no seu servidor usando **Traefik** como reverse proxy.

## 🎯 Vantagens do Traefik

✅ **SSL Automático** - Let's Encrypt integrado  
✅ **Múltiplas Apps** - Roteamento por domínio/subdomínio  
✅ **Load Balancing** - Distribuição automática de carga  
✅ **Dashboard** - Interface web para monitoramento  
✅ **Hot Reload** - Configuração dinâmica sem restart

## 📋 Pré-requisitos

- Servidor com Docker e Portainer instalados
- **Traefik já rodando** no servidor
- Domínio configurado (ex: `eventos.seudominio.com`)
- Network `traefik` criada

### Verificar se Traefik está funcionando:

```bash
# Verificar se a network traefik existe
docker network ls | grep traefik

# Se não existir, criar:
docker network create traefik
```

## 🔧 Configuração

### 1. Configurar Variáveis de Ambiente

Copie e edite o arquivo de ambiente:

```bash
cp env.traefik.example .env
nano .env
```

**Configuração mínima necessária:**

```bash
# SEU DOMÍNIO (IMPORTANTE!)
DOMAIN=eventos.seudominio.com

# Banco de dados
DATABASE_NAME=gerenciador_eventos
DATABASE_USER=postgres
DATABASE_PASSWORD=MinhaSegura123!

# JWT (gere uma chave forte)
JWT_SECRET=minha_chave_jwt_super_secreta_12345678901234567890

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua_senha_de_app

# URLs (use seu domínio)
FRONTEND_URL=https://eventos.seudominio.com
REACT_APP_API_URL=https://eventos.seudominio.com
```

### 2. Deploy no Portainer

#### Opção A: Stack com Repository (Recomendado)

1. **Portainer** → **Stacks** → **Add Stack**
2. **Nome**: `gerenciador-eventos`
3. **Build method**: "Repository"
4. **Repository URL**: `https://github.com/jeffersonjrpro/GerenciadordeEventosCAAMG`
5. **Reference**: `main`
6. **Compose path**: `docker-compose.traefik.yml`
7. **Environment variables**: Cole seu arquivo `.env`
8. **Deploy the stack**

#### Opção B: Upload Manual

1. Faça upload do projeto para o servidor
2. **Portainer** → **Stacks** → **Add Stack**
3. **Build method**: "Upload"
4. Selecione `docker-compose.traefik.yml`
5. Configure as variáveis de ambiente
6. **Deploy the stack**

## 🌐 Roteamento Traefik

O sistema configurará automaticamente:

### Rotas Principais:
- **Frontend**: `https://eventos.seudominio.com/`
- **API Backend**: `https://eventos.seudominio.com/api/`
- **Uploads**: `https://eventos.seudominio.com/uploads/`
- **QR Codes**: `https://eventos.seudominio.com/qr-code/`

### Labels Traefik Aplicadas:

```yaml
# Frontend
- "traefik.http.routers.eventos-frontend.rule=Host(`eventos.seudominio.com`)"
- "traefik.http.routers.eventos-frontend.entrypoints=websecure"
- "traefik.http.routers.eventos-frontend.tls.certresolver=letsencrypt"

# Backend API
- "traefik.http.routers.eventos-backend.rule=Host(`eventos.seudominio.com`) && PathPrefix(`/api/`)"
- "traefik.http.routers.eventos-backend.entrypoints=websecure"
- "traefik.http.routers.eventos-backend.tls.certresolver=letsencrypt"
```

## 🔍 Verificação

### 1. Containers Rodando

No Portainer, verifique se estão "running":
- `gerenciador-eventos_postgres_1`
- `gerenciador-eventos_backend_1`
- `gerenciador-eventos_frontend_1`

### 2. Traefik Dashboard

Acesse o dashboard do Traefik e verifique se as rotas aparecem:
- `eventos-frontend`
- `eventos-backend`
- `eventos-uploads`
- `eventos-qr`

### 3. Testes de Acesso

```bash
# Frontend
curl -I https://eventos.seudominio.com

# API
curl https://eventos.seudominio.com/api/public/planos
```

## 🛠️ Troubleshooting

### Problema: Traefik não encontra os serviços

**Solução:**
```bash
# Verificar se containers estão na network traefik
docker network inspect traefik

# Restart da stack se necessário
# No Portainer: Stack → Actions → Stop → Start
```

### Problema: SSL não funciona

**Verificações:**
1. Domínio aponta para o servidor? `nslookup eventos.seudominio.com`
2. Portas 80/443 abertas no firewall?
3. Traefik configurado com Let's Encrypt?
4. Aguarde alguns minutos para geração do certificado

### Problema: API retorna erro 502

**Verificações:**
1. Backend está healthy? Veja logs no Portainer
2. Banco conectado? Logs do container postgres
3. Variáveis de ambiente corretas? Veja configuração da stack

## 🚀 Primeiro Acesso

1. **Aguarde 2-5 minutos** para inicialização completa
2. **Acesse**: `https://eventos.seudominio.com`
3. **Login inicial**:
   - Email: `admin@admin.com`
   - Senha: `Admin123`
4. **⚠️ ALTERE A SENHA** imediatamente!

## ✅ Checklist Final

- [ ] Traefik rodando no servidor
- [ ] Network `traefik` criada
- [ ] Domínio apontando para o servidor
- [ ] Arquivo `.env` configurado com seu domínio
- [ ] Stack deployada no Portainer
- [ ] Containers rodando (postgres, backend, frontend)
- [ ] Traefik dashboard mostrando as rotas
- [ ] HTTPS funcionando (certificado válido)
- [ ] Login inicial realizado
- [ ] Senha admin alterada

## 🎉 Sucesso!

Seu **Gerenciador de Eventos** está rodando com:
- ✅ **SSL automático** via Let's Encrypt
- ✅ **Roteamento inteligente** via Traefik
- ✅ **Alta disponibilidade** e escalabilidade
- ✅ **Monitoramento** integrado

**Domínio**: `https://eventos.seudominio.com`

---

💡 **Dica**: Para múltiplas aplicações, apenas ajuste o `DOMAIN` no `.env` de cada uma!

🆘 **Problemas?** Verifique os logs no Portainer e dashboard do Traefik. 