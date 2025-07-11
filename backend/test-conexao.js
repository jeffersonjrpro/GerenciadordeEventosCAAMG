const SMB2 = require('smb2');

console.log('🔍 Testando diferentes formatos de conexão SMB...');

// Teste 1: Caminho raiz
console.log('\nTeste 1: Caminho raiz');
const smb1 = new SMB2({
  share: '\\\\caafiles-v\\App_Eventos',
  username: 'eventos',
  password: 'Caa.@silver25',
  domain: 'caamg'
});

smb1.readdir('\\', (err, files) => {
  if (err) {
    console.log('❌ Erro 1:', err.message);
  } else {
    console.log('✅ Sucesso 1:', files);
  }
  smb1.close();
  
  // Teste 2: Caminho vazio
  console.log('\nTeste 2: Caminho vazio');
  const smb2 = new SMB2({
    share: '\\\\caafiles-v\\App_Eventos',
    username: 'eventos',
    password: 'Caa.@silver25',
    domain: 'caamg'
  });
  
  smb2.readdir('', (err, files) => {
    if (err) {
      console.log('❌ Erro 2:', err.message);
    } else {
      console.log('✅ Sucesso 2:', files);
    }
    smb2.close();
    
    // Teste 3: Caminho com ponto
    console.log('\nTeste 3: Caminho com ponto');
    const smb3 = new SMB2({
      share: '\\\\caafiles-v\\App_Eventos',
      username: 'eventos',
      password: 'Caa.@silver25',
      domain: 'caamg'
    });
    
    smb3.readdir('.', (err, files) => {
      if (err) {
        console.log('❌ Erro 3:', err.message);
      } else {
        console.log('✅ Sucesso 3:', files);
      }
      smb3.close();
    });
  });
}); 