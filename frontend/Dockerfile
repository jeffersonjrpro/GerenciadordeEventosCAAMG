# Estágio de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Definir variáveis de ambiente de build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Construir aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Comando padrão
CMD ["nginx", "-g", "daemon off;"] 