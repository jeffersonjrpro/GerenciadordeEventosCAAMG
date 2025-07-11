const axios = require('axios');

async function testCriarEvento() {
  try {
    console.log('=== TESTANDO CRIAÇÃO DE EVENTO ===');
    
    // 1. Fazer login com um usuário
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'teste.novo@exemplo.com',
      password: 'Senha123'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('✅ Login realizado com sucesso!');
    console.log('Usuário:', user.name);
    console.log('Email:', user.email);
    console.log('empresaId:', user.empresaId);
    console.log('trabalharTodosEventos:', user.trabalharTodosEventos);
    
    // 2. Criar um evento
    console.log('\n2. Criando evento...');
    const eventData = {
      name: 'Evento Teste Debug',
      description: 'Evento para testar o processo de criação',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias no futuro
      location: 'Local Teste',
      maxGuests: 100,
      isActive: true,
      isPublic: true
    };
    
    console.log('Dados do evento:', eventData);
    
    const createResponse = await axios.post('http://localhost:5000/api/events', eventData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const evento = createResponse.data.data;
    console.log('✅ Evento criado com sucesso!');
    console.log('Evento ID:', evento.id);
    console.log('Nome:', evento.name);
    console.log('empresaId:', evento.empresaId);
    console.log('userId (criador):', evento.userId);
    console.log('isActive:', evento.isActive);
    
    // 3. Verificar se o evento aparece na listagem
    console.log('\n3. Verificando se o evento aparece na listagem...');
    const listResponse = await axios.get('http://localhost:5000/api/events/meus-eventos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const eventos = listResponse.data.data;
    console.log(`✅ Listagem retornou ${eventos.length} eventos`);
    
    const eventoEncontrado = eventos.find(e => e.id === evento.id);
    if (eventoEncontrado) {
      console.log('✅ Evento encontrado na listagem!');
      console.log('Nome na listagem:', eventoEncontrado.name);
      console.log('empresaId na listagem:', eventoEncontrado.empresaId);
    } else {
      console.log('❌ Evento NÃO encontrado na listagem!');
      console.log('Eventos na listagem:');
      eventos.forEach(e => {
        console.log(`  - ${e.name} (ID: ${e.id}, empresaId: ${e.empresaId})`);
      });
    }
    
    // 4. Verificar se o evento aparece para outro usuário da mesma empresa
    console.log('\n4. Testando com outro usuário da mesma empresa...');
    
    // Fazer login com outro usuário (se existir)
    try {
      const loginResponse2 = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'teste@teste.com.br',
        password: 'Senha123'
      });
      
      const token2 = loginResponse2.data.data.token;
      const user2 = loginResponse2.data.data.user;
      
      console.log('✅ Login com segundo usuário realizado!');
      console.log('Usuário 2:', user2.name);
      console.log('empresaId:', user2.empresaId);
      console.log('trabalharTodosEventos:', user2.trabalharTodosEventos);
      
      const listResponse2 = await axios.get('http://localhost:5000/api/events/meus-eventos', {
        headers: {
          'Authorization': `Bearer ${token2}`
        }
      });
      
      const eventos2 = listResponse2.data.data;
      console.log(`✅ Listagem do usuário 2 retornou ${eventos2.length} eventos`);
      
      const eventoEncontrado2 = eventos2.find(e => e.id === evento.id);
      if (eventoEncontrado2) {
        console.log('✅ Evento encontrado na listagem do usuário 2!');
      } else {
        console.log('❌ Evento NÃO encontrado na listagem do usuário 2!');
      }
      
    } catch (error) {
      console.log('⚠️  Não foi possível testar com segundo usuário:', error.response?.data?.error || error.message);
    }
    
    console.log('\n🎉 TESTE DE CRIAÇÃO CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testCriarEvento(); 