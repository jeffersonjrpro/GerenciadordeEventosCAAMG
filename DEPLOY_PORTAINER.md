# 🚀 Deploy no Portainer - Gerenciador de Eventos

Este guia te ajudará a instalar o **Gerenciador de Eventos** no seu servidor usando **Portainer**.

## 📋 Pré-requisitos

- Servidor com Docker e Portainer instalados
- Acesso admin ao Portainer
- Domínio configurado (opcional, mas recomendado)
- Certificado SSL (opcional)

## 🔧 Passo a Passo

### 1. Preparar Arquivos

1. **Clone ou baixe o repositório** no seu servidor:
```bash
git clone https://github.com/jeffersonjrpro/GerenciadordeEventosCAAMG.git
cd GerenciadordeEventosCAAMG
```

2. **Configure as variáveis de ambiente**:
```bash
cp env.production.example .env
nano .env
```

Edite o arquivo `.env` com suas configurações:

```bash
# Configurações do Banco de Dados
DATABASE_NAME=gerenciador_eventos
DATABASE_USER=postgres
DATABASE_PASSWORD=SuaSenhaSeguraAqui123!

# Configurações JWT
JWT_SECRET=sua_chave_jwt_super_secreta_e_longa_para_producao_123456789

# Configurações de Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app_gmail

# URLs da Aplicação
FRONTEND_URL=https://seu-dominio.com
REACT_APP_API_URL=https://seu-dominio.com

# Portas (ajuste conforme necessário)
HTTP_PORT=80
HTTPS_PORT=443
```

### 2. Deploy via Portainer

#### Opção A: Stack do Portainer (Recomendado)

1. **Acesse o Portainer** no seu servidor
2. Vá em **Stacks** → **Add Stack**
3. **Nome da Stack**: `gerenciador-eventos`
4. **Build method**: Selecione "Repository"
5. **Repository URL**: `https://github.com/jeffersonjrpro/GerenciadordeEventosCAAMG`
6. **Reference**: `main`
7. **Compose path**: `docker-compose.yml`
8. **Environment variables**: Cole o conteúdo do seu arquivo `.env`
9. Clique em **Deploy the stack**

#### Opção B: Arquivo Local

1. **Upload do projeto**:
   - Faça upload do projeto para uma pasta no servidor
   - No Portainer, vá em **Stacks** → **Add Stack**
   - **Build method**: "Upload"
   - Faça upload do `docker-compose.yml`
   - Configure as variáveis de ambiente

### 3. Configuração SSL (Opcional)

Se você tem certificado SSL:

1. **Crie pasta SSL**:
```bash
mkdir ssl
# Copie seus arquivos cert.pem e key.pem para a pasta ssl/
```

2. **Descomente as linhas HTTPS** no `nginx/default.conf`:
```nginx
server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... resto da configuração
}
```

3. **Redeploy a stack** no Portainer

### 4. Acesso Inicial

1. **Aguarde a inicialização** (pode levar alguns minutos)
2. **Acesse**: `http://seu-servidor` ou `https://seu-dominio.com`
3. **Login inicial**:
   - Email: `admin@admin.com`
   - Senha: `Admin123`
4. **⚠️ IMPORTANTE**: Altere a senha padrão imediatamente!

## 🔍 Verificação e Troubleshooting

### Verificar Status dos Containers

No Portainer, vá em **Containers** e verifique se todos estão "running":
- `gerenciador-eventos_postgres_1`
- `gerenciador-eventos_backend_1`
- `gerenciador-eventos_frontend_1`
- `gerenciador-eventos_nginx_1`

### Verificar Logs

Se algo não funcionar, verifique os logs no Portainer:
1. Clique no container com problema
2. Vá na aba **Logs**
3. Procure por mensagens de erro

### Health Checks

- **Aplicação**: `http://seu-servidor/health`
- **API**: `http://seu-servidor/api/public/planos`

### Problemas Comuns

#### 1. Backend não conecta no banco
```bash
# Verifique as credenciais no .env
# Aguarde mais tempo para o PostgreSQL inicializar
```

#### 2. Frontend não carrega
```bash
# Verifique se REACT_APP_API_URL está correto no .env
# Veja logs do container nginx
```

#### 3. Uploads não funcionam
```bash
# Verifique permissões da pasta uploads
# Confirme se o volume foi criado corretamente
```

## 📊 Monitoramento

### Recursos Recomendados

- **RAM**: Mínimo 2GB, recomendado 4GB
- **CPU**: 2 cores
- **Disco**: 20GB livre (para uploads e banco)
- **Rede**: Portas 80 e 443 abertas

### Backup

Configure backup automático dos volumes:
- `postgres_data`: Dados do banco
- `uploads`: Arquivos enviados

## 🔄 Atualizações

Para atualizar o sistema:

1. **No Portainer**:
   - Vá na Stack
   - Clique em **Editor**
   - **Git Pull** para puxar atualizações
   - **Update the stack**

2. **Manual**:
```bash
git pull origin main
# Rebuild via Portainer
```

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs** no Portainer
2. **Consulte este README**
3. **Abra uma issue** no GitHub
4. **Email**: suporte@seudominio.com

## 🎯 Configurações Avançadas

### Load Balancer

Para múltiplas instâncias:
```yaml
# Adicione no docker-compose.yml
deploy:
  replicas: 2
```

### Backup Automático

```bash
# Script de backup (execute via cron)
docker exec postgres pg_dump -U postgres gerenciador_eventos > backup.sql
```

### SSL Automático (Let's Encrypt)

Use **Traefik** ou **Caddy** como proxy reverso para SSL automático.

---

## ✅ Checklist Final

- [ ] Arquivo `.env` configurado
- [ ] Stack deployada no Portainer
- [ ] Todos os containers rodando
- [ ] Aplicação acessível via browser
- [ ] Login inicial funcionando
- [ ] Senha admin alterada
- [ ] SSL configurado (se aplicável)
- [ ] Backup configurado

**🎉 Sistema instalado com sucesso!** 