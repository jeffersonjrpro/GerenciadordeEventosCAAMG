# 🚀 Instruções de Deploy - Gerenciador de Eventos CAAMG

## 📋 Pré-requisitos
- Docker e Docker Compose instalados no servidor
- Traefik já configurado e rodando
- Rede `traefik_default` criada
- Domínio `eventos.caamg.com.br` apontando para o servidor

## 🔧 Passos para Deploy

### 1. Acesse o servidor via SSH
```bash
ssh root@seu-servidor
```

### 2. Navegue para o diretório do projeto
```bash
cd /opt/gerenciador-eventos
```

### 3. Atualize o código (se necessário)
```bash
git pull
```

### 4. Pare os containers atuais
```bash
docker-compose down
```

### 5. Remova containers antigos (se houver)
```bash
docker-compose rm -f
```

### 6. Torne o script executável e execute
```bash
chmod +x restart-containers.sh
./restart-containers.sh
```

### 7. Verifique o status dos containers
```bash
docker-compose ps
```

### 8. Verifique os logs se necessário
```bash
# Logs do frontend
docker-compose logs frontend

# Logs do backend
docker-compose logs backend

# Logs do Traefik
docker logs traefik --tail 50
```

## 🌐 Configuração do Traefik

O Traefik está configurado para:
- **Frontend**: `https://eventos.caamg.com.br` (porta 3000)
- **Backend**: `https://eventos.caamg.com.br/api/` (porta 3001)
- **SSL/TLS**: Automático via Let's Encrypt

## 🔧 Correções Aplicadas

### Problema do Cadastro
- ✅ **Corrigido**: `REACT_APP_API_URL` agora aponta para `https://eventos.caamg.com.br/api`
- ✅ **Resultado**: O frontend agora faz requisições corretas para `/api/auth/register`

### Estrutura das URLs
```
Frontend: https://eventos.caamg.com.br/
API:      https://eventos.caamg.com.br/api/
```

## 🔍 Troubleshooting

### Se o Traefik não encontrar os containers:
1. Verifique se a rede `traefik_default` existe:
   ```bash
   docker network ls | grep traefik_default
   ```

2. Se não existir, crie:
   ```bash
   docker network create traefik_default
   ```

3. Reinicie o Traefik:
   ```bash
   docker restart traefik
   ```

### Se os containers não iniciarem:
1. Verifique os logs:
   ```bash
   docker-compose logs
   ```

2. Verifique se o banco PostgreSQL está acessível:
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```

### Se o cadastro não funcionar:
1. Verifique se a API está respondendo:
   ```bash
   curl https://eventos.caamg.com.br/api/health
   ```

2. Verifique os logs do frontend:
   ```bash
   docker-compose logs frontend
   ```

3. Verifique os logs do backend:
   ```bash
   docker-compose logs backend
   ```

### Se o domínio não carregar:
1. Verifique se o DNS está apontando para o servidor
2. Verifique se a porta 443 está aberta no firewall
3. Verifique os logs do Traefik para erros de certificado SSL

## 📊 Monitoramento

Para monitorar a aplicação:
```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Logs em tempo real
docker-compose logs -f
```

## 🔄 Atualizações

Para atualizar a aplicação:
1. Pare os containers: `docker-compose down`
2. Faça pull das mudanças: `git pull`
3. Reconstrua: `docker-compose up -d --build`

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs dos containers
2. Verifique a conectividade de rede
3. Verifique a configuração do Traefik
4. Consulte a documentação do Docker e Traefik 