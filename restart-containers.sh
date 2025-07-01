#!/bin/bash

echo "🛑 Parando containers atuais..."
docker-compose down

echo "🧹 Removendo containers antigos..."
docker-compose rm -f

echo "🔄 Reiniciando containers com nova configuração..."
docker-compose up -d

echo "⏳ Aguardando containers iniciarem..."
sleep 30

echo "📊 Status dos containers:"
docker-compose ps

echo "🔍 Verificando logs do Traefik..."
docker logs traefik --tail 20

echo "✅ Processo concluído!" 