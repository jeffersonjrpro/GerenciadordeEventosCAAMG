#!/bin/bash

echo "🔍 Verificando status do deploy..."

echo ""
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "🌐 Verificando conectividade de rede:"
echo "Rede traefik_default existe?"
docker network ls | grep traefik_default

echo ""
echo "🔗 Testando conectividade entre containers:"
echo "Backend pode acessar o frontend?"
docker-compose exec backend ping -c 2 frontend 2>/dev/null || echo "❌ Não conseguiu conectar"

echo ""
echo "📝 Logs recentes do Traefik:"
docker logs traefik --tail 10

echo ""
echo "🏥 Health checks:"
echo "PostgreSQL:"
docker-compose exec postgres pg_isready -U postgres

echo ""
echo "Backend API:"
curl -s http://localhost:3001/api/health || echo "❌ Backend não responde"

echo ""
echo "Frontend:"
curl -s http://localhost:3000 | head -5 || echo "❌ Frontend não responde"

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "🌐 Para acessar a aplicação:"
echo "   Frontend: https://eventos.caamg.com.br"
echo "   Backend:  https://eventos.caamg.com.br/api/health" 