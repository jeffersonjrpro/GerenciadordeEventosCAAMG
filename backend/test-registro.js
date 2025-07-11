const axios = require('axios');

async function testRegistro() {
  try {
    console.log('=== TESTANDO REGISTRO DE NOVO USUÁRIO ===');
    
    // Dados para registro
    const userData = {
      name: 'Teste Novo',
      email: 'teste.novo@exemplo.com',
      password: 'Senha123', // Senha válida com maiúscula, minúscula e número
      telefone: '(31) 99999-9999',
      nomeEmpresa: 'Empresa Teste',
      codigoEmpresa: '' // Deixar vazio para criar nova empresa
    };
    
    console.log('\n1. Fazendo registro...');
    console.log('Dados:', userData);
    
    const response = await axios.post('http://localhost:5000/api/auth/register', userData);
    
    console.log('\n✅ Registro realizado com sucesso!');
    console.log('User ID:', response.data.data.user.id);
    console.log('Email:', response.data.data.user.email);
    console.log('codigoEmpresa:', response.data.data.user.codigoEmpresa);
    console.log('empresaId:', response.data.data.user.empresaId);
    console.log('nomeEmpresa:', response.data.data.user.nomeEmpresa);
    
    // Testar login para verificar se os dados persistem
    console.log('\n2. Testando login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: userData.email,
      password: userData.password
    });
    
    const user = loginResponse.data.data.user;
    console.log('✅ Login realizado com sucesso!');
    console.log('codigoEmpresa:', user.codigoEmpresa);
    console.log('empresaId:', user.empresaId);
    console.log('nomeEmpresa:', user.nomeEmpresa);
    
    // Testar endpoint /auth/verify
    console.log('\n3. Testando endpoint /auth/verify...');
    const token = loginResponse.data.data.token;
    const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const verifiedUser = verifyResponse.data.data.user;
    console.log('✅ Verificação realizada com sucesso!');
    console.log('codigoEmpresa:', verifiedUser.codigoEmpresa);
    console.log('empresaId:', verifiedUser.empresaId);
    console.log('nomeEmpresa:', verifiedUser.nomeEmpresa);
    
    // Verificar consistência
    console.log('\n4. Verificando consistência...');
    if (user.codigoEmpresa === verifiedUser.codigoEmpresa) {
      console.log('✅ codigoEmpresa está consistente!');
    } else {
      console.log('❌ INCONSISTÊNCIA: codigoEmpresa diferente');
    }
    
    if (user.empresaId === verifiedUser.empresaId) {
      console.log('✅ empresaId está consistente!');
    } else {
      console.log('❌ INCONSISTÊNCIA: empresaId diferente');
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('Agora você pode testar no frontend!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testRegistro(); 