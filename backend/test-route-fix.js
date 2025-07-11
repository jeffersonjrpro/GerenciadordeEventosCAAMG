const axios = require('axios');

async function testRouteFix() {
  try {
    console.log('🔍 Testando rota /meus-eventos após correção...');
    
    // Testar sem token (modo teste ativado)
    const response = await axios.get('http://localhost:5000/api/events/meus-eventos?limit=10');
    
    console.log('✅ Status:', response.status);
    console.log('✅ Dados:', JSON.stringify(response.data, null, 2));
    console.log('✅ Quantidade de eventos:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('✅ Eventos encontrados:');
      response.data.data.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.name} (ID: ${event.id})`);
      });
    } else {
      console.log('❌ Nenhum evento encontrado');
    }
    
  } catch (error) {
    console.log('❌ Erro na API:', error.response?.data || error.message);
    console.log('❌ Status do erro:', error.response?.status);
  }
}

testRouteFix(); 