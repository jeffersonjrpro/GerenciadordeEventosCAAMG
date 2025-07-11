const axios = require('axios');

async function testVerifyToken() {
  try {
    console.log('=== TESTANDO ENDPOINT /auth/verify ===');
    
    // Primeiro, fazer login para obter um token
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      email: 'teste@teste.com.br',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('Login realizado com sucesso!');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('codigoEmpresa:', user.codigoEmpresa);
    console.log('empresaId:', user.empresaId);
    console.log('nomeEmpresa:', user.nomeEmpresa);
    
    // Agora testar o endpoint /auth/verify
    console.log('\n2. Testando endpoint /auth/verify...');
    const verifyResponse = await axios.get('http://localhost:3001/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const verifiedUser = verifyResponse.data.data.user;
    
    console.log('Verificação realizada com sucesso!');
    console.log('User ID:', verifiedUser.id);
    console.log('Email:', verifiedUser.email);
    console.log('codigoEmpresa:', verifiedUser.codigoEmpresa);
    console.log('empresaId:', verifiedUser.empresaId);
    console.log('nomeEmpresa:', verifiedUser.nomeEmpresa);
    
    // Verificar se os dados estão corretos
    console.log('\n3. Verificando consistência...');
    
    if (user.codigoEmpresa === verifiedUser.codigoEmpresa) {
      console.log('✅ codigoEmpresa está consistente entre login e verify');
    } else {
      console.log('❌ INCONSISTÊNCIA: codigoEmpresa diferente entre login e verify');
      console.log('  Login:', user.codigoEmpresa);
      console.log('  Verify:', verifiedUser.codigoEmpresa);
    }
    
    if (user.empresaId === verifiedUser.empresaId) {
      console.log('✅ empresaId está consistente entre login e verify');
    } else {
      console.log('❌ INCONSISTÊNCIA: empresaId diferente entre login e verify');
    }
    
    if (user.nomeEmpresa === verifiedUser.nomeEmpresa) {
      console.log('✅ nomeEmpresa está consistente entre login e verify');
    } else {
      console.log('❌ INCONSISTÊNCIA: nomeEmpresa diferente entre login e verify');
    }
    
  } catch (error) {
    console.error('Erro no teste:', error.response?.data || error.message);
  }
}

testVerifyToken(); 