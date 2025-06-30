# Use Node.js 18 LTS
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    postgresql-client

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Criar diretórios necessários
RUN mkdir -p uploads/events temp

# Expor porta
EXPOSE 3001

# Script de inicialização
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Comando padrão
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"] 