const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Testando API diretamente...');
    
    // Simular um token de autenticação (você precisa substituir por um token válido)
    // Para obter um token válido, faça login no frontend e copie o token do localStorage
    const token = 'SEU_TOKEN_AQUI'; // Substitua por um token válido
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('📊 Testando rota /events/meus-eventos...');
    try {
      const response = await axios.get('http://localhost:5000/api/events/meus-eventos?limit=10', { headers });
      console.log('✅ Status:', response.status);
      console.log('✅ Headers:', response.headers);
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
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAPI(); 