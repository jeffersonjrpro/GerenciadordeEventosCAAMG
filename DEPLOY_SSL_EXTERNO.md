# 🔐 Deploy com SSL Externo + Traefik - Gerenciador de Eventos

Este guia é para você que já tem **certificado SSL de uma gerenciadora externa** (não Let's Encrypt) e quer usar com Traefik.

## 🎯 Cenário: SSL Corporativo

✅ **Certificado próprio** - De empresa/autoridade certificadora  
✅ **Traefik gerencia** - Roteamento inteligente  
✅ **Múltiplas apps** - Várias aplicações no mesmo servidor  
✅ **SSL centralizado** - Certificado configurado no Traefik  

## 📋 Pré-requisitos

- Servidor com Docker e Portainer
- **Traefik rodando** com SSL externo configurado
- **Network traefik** criada
- **Certificado SSL** já instalado no Traefik
- Domínio configurado (ex: `eventos.seudominio.com`)

## 🔧 Configuração do Traefik (Referência)

Se ainda não configurou SSL externo no Traefik, aqui está um exemplo:

### Estrutura de arquivos:
```
/traefik/
├── docker-compose.yml
├── traefik.yml
├── ssl/
│   ├── seudominio.crt    # Seu certificado
│   └── seudominio.key    # Sua chave privada
```

### traefik.yml (configuração estática):
```yaml
# Entrypoints
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

# Providers
providers:
  docker:
    exposedByDefault: false
    network: traefik
  file:
    filename: /etc/traefik/dynamic.yml
    watch: true

# API
api:
  dashboard: true

# Logs
log:
  level: INFO

accessLog: {}
```

### dynamic.yml (configuração dinâmica):
```yaml
# Certificados SSL
tls:
  certificates:
    - certFile: /etc/ssl/seudominio.crt
      keyFile: /etc/ssl/seudominio.key
      stores:
        - default

# Store padrão
stores:
  default:
    defaultCertificate:
      certFile: /etc/ssl/seudominio.crt
      keyFile: /etc/ssl/seudominio.key

# Redirecionamento HTTP->HTTPS global
http:
  middlewares:
    https-redirect:
      redirectScheme:
        scheme: https
        permanent: true
  
  routers:
    http-to-https:
      rule: "HostRegexp(`{host:.+}`)"
      entryPoints:
        - web
      middlewares:
        - https-redirect
```

### docker-compose.yml do Traefik:
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./dynamic.yml:/etc/traefik/dynamic.yml:ro
      - ./ssl:/etc/ssl:ro  # Seus certificados SSL
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.seudominio.com`)"
      - "traefik.http.routers.dashboard.entrypoints=websecure"
      - "traefik.http.routers.dashboard.tls=true"

networks:
  traefik:
    external: true
```

## 🚀 Deploy do Gerenciador de Eventos

### 1. Configurar Variáveis de Ambiente

```bash
cp env.traefik.example .env
nano .env
```

**Configure com seu domínio:**
```bash
# SEU DOMÍNIO (onde está o certificado SSL)
DOMAIN=eventos.seudominio.com

# Banco de dados
DATABASE_NAME=gerenciador_eventos
DATABASE_USER=postgres
DATABASE_PASSWORD=MinhaSegura123!

# JWT
JWT_SECRET=minha_chave_jwt_super_secreta_12345678901234567890

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua_senha_de_app

# URLs (HTTPS com seu domínio)
FRONTEND_URL=https://eventos.seudominio.com
REACT_APP_API_URL=https://eventos.seudominio.com
```

### 2. Deploy no Portainer

1. **Portainer** → **Stacks** → **Add Stack**
2. **Nome**: `gerenciador-eventos`
3. **Build method**: "Repository"
4. **Repository URL**: `https://github.com/jeffersonjrpro/GerenciadordeEventosCAAMG`
5. **Reference**: `main`
6. **Compose path**: `docker-compose.ssl-externo.yml`
7. **Environment variables**: Cole seu arquivo `.env`
8. **Deploy the stack**

## 🌐 Como Funciona

### Labels Traefik (SSL Externo):
```yaml
# Frontend
- "traefik.http.routers.eventos-frontend.rule=Host(`eventos.seudominio.com`)"
- "traefik.http.routers.eventos-frontend.entrypoints=websecure"
- "traefik.http.routers.eventos-frontend.tls=true"

# Backend API
- "traefik.http.routers.eventos-backend.rule=Host(`eventos.seudominio.com`) && PathPrefix(`/api/`)"
- "traefik.http.routers.eventos-backend.entrypoints=websecure"
- "traefik.http.routers.eventos-backend.tls=true"
```

### Principais diferenças:
- ❌ **Sem certresolver**: Não usa Let's Encrypt
- ✅ **tls=true**: Usa certificado do Traefik
- ✅ **SSL centralizado**: Gerenciado pelo Traefik
- ✅ **Wildcard suportado**: Se seu certificado for wildcard

## 🔍 Verificações

### 1. Certificado SSL Funcionando
```bash
# Teste o certificado
openssl s_client -connect eventos.seudominio.com:443 -servername eventos.seudominio.com

# Verificar expiração
echo | openssl s_client -connect eventos.seudominio.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 2. Roteamento Traefik
- **Dashboard**: `https://traefik.seudominio.com`
- **Rotas visíveis**: `eventos-frontend`, `eventos-backend`

### 3. Aplicação Funcionando
```bash
# Frontend
curl -I https://eventos.seudominio.com

# API
curl https://eventos.seudominio.com/api/public/planos
```

## 🛠️ Troubleshooting

### Problema: SSL não funciona

**Verificações:**
1. **Certificado válido?**
```bash
openssl x509 -in ssl/seudominio.crt -text -noout | grep "Not After"
```

2. **Domínio no certificado?**
```bash
openssl x509 -in ssl/seudominio.crt -text -noout | grep -A1 "Subject Alternative Name"
```

3. **Traefik carregou o certificado?**
- Veja logs do Traefik: `docker logs traefik`
- Dashboard: `https://traefik.seudominio.com`

### Problema: Traefik não encontra certificado

**Soluções:**
1. **Verificar paths dos certificados**:
```yaml
# dynamic.yml
tls:
  certificates:
    - certFile: /etc/ssl/seudominio.crt  # Path dentro do container
      keyFile: /etc/ssl/seudominio.key
```

2. **Permissões dos arquivos**:
```bash
chmod 644 ssl/seudominio.crt
chmod 600 ssl/seudominio.key
```

3. **Restart do Traefik**:
```bash
docker restart traefik
```

### Problema: Certificado expirado

**Soluções:**
1. **Renovar certificado** com sua gerenciadora
2. **Substituir arquivos**:
```bash
# Backup do antigo
cp ssl/seudominio.crt ssl/seudominio.crt.old

# Colocar novo certificado
cp novo_certificado.crt ssl/seudominio.crt
cp nova_chave.key ssl/seudominio.key

# Restart do Traefik
docker restart traefik
```

## 🎯 Certificados Wildcard

Se você tem certificado wildcard (`*.seudominio.com`):

### Vantagens:
✅ **Múltiplos subdomínios** com um certificado  
✅ **Fácil adição** de novas aplicações  
✅ **Menor gerenciamento** de certificados  

### Exemplo de uso:
```bash
# Suas aplicações
https://eventos.seudominio.com     # Gerenciador de Eventos
https://app1.seudominio.com        # Outra aplicação
https://app2.seudominio.com        # Mais uma aplicação
https://traefik.seudominio.com     # Dashboard Traefik
```

## 🚀 Primeiro Acesso

1. **Aguarde inicialização** (2-5 minutos)
2. **Acesse**: `https://eventos.seudominio.com`
3. **Verifique SSL**: Cadeado verde no browser
4. **Login inicial**:
   - Email: `admin@admin.com`
   - Senha: `Admin123`
5. **⚠️ ALTERE A SENHA** imediatamente!

## ✅ Checklist Final

- [ ] Traefik rodando com SSL externo
- [ ] Certificado SSL válido e não expirado
- [ ] Network `traefik` criada
- [ ] Domínio apontando para o servidor
- [ ] Arquivo `.env` configurado
- [ ] Stack deployada no Portainer
- [ ] Containers rodando (postgres, backend, frontend)
- [ ] SSL funcionando (cadeado verde)
- [ ] Dashboard Traefik mostrando rotas
- [ ] Login inicial realizado
- [ ] Senha admin alterada

## 🎉 Sucesso!

Seu **Gerenciador de Eventos** está rodando com:
- ✅ **SSL corporativo** validado
- ✅ **Certificado gerenciado** centralmente
- ✅ **Roteamento inteligente** via Traefik
- ✅ **Múltiplas aplicações** suportadas

**Domínio seguro**: `https://eventos.seudominio.com`

---

💡 **Dica**: Monitore a expiração do certificado e configure alertas na sua gerenciadora!

🆘 **Problemas?** Verifique os logs do Traefik e certificados SSL. 