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

echo "🧪 Testando API..."
echo "Testando endpoint de health:"
curl -s https://eventos.caamg.com.br/api/health || echo "❌ API não responde"

echo ""
echo "✅ Processo concluído!"
echo ""
echo "🌐 URLs da aplicação:"
echo "   Frontend: https://eventos.caamg.com.br"
echo "   API:      https://eventos.caamg.com.br/api" 