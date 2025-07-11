const axios = require('axios');

async function testRotasEventos() {
  try {
    console.log('🔍 Testando rotas de eventos...');
    
    // Simular um token de autenticação (você precisa substituir por um token válido)
    const token = 'SEU_TOKEN_AQUI'; // Substitua por um token válido
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('📊 Testando rota /events/my-events (usada pelo dashboard):');
    try {
      const response1 = await axios.get('http://localhost:5000/api/events/my-events?limit=10', { headers });
      console.log('✅ /events/my-events - Status:', response1.status);
      console.log('📊 Eventos encontrados:', response1.data.data?.length || 0);
      console.log('📄 Resposta:', JSON.stringify(response1.data, null, 2));
    } catch (error) {
      console.log('❌ /events/my-events - Erro:', error.response?.data || error.message);
    }
    
    console.log('\n📊 Testando rota /events/meus-eventos (usada pela página de eventos):');
    try {
      const response2 = await axios.get('http://localhost:5000/api/events/meus-eventos?limit=10', { headers });
      console.log('✅ /events/meus-eventos - Status:', response2.status);
      console.log('📊 Eventos encontrados:', response2.data.data?.length || 0);
      console.log('📄 Resposta:', JSON.stringify(response2.data, null, 2));
    } catch (error) {
      console.log('❌ /events/meus-eventos - Erro:', error.response?.data || error.message);
    }
    
    console.log('\n🔍 Comparando respostas...');
    if (response1?.data?.data?.length === response2?.data?.data?.length) {
      console.log('✅ Ambas as rotas retornam o mesmo número de eventos');
    } else {
      console.log('❌ As rotas retornam números diferentes de eventos');
      console.log(`   /events/my-events: ${response1?.data?.data?.length || 0}`);
      console.log(`   /events/meus-eventos: ${response2?.data?.data?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testRotasEventos(); 