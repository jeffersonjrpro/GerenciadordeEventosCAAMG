const prisma = require('./src/config/database');

async function checkCodigoEmpresa() {
  try {
    console.log('=== VERIFICANDO CÓDIGO DA EMPRESA ===');
    
    // 1. Verificar usuários e seus códigos
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        codigoEmpresa: true,
        empresaId: true,
        nomeEmpresa: true
      }
    });
    
    console.log('\nUsuários encontrados:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}):`);
      console.log(`  codigoEmpresa: "${user.codigoEmpresa}"`);
      console.log(`  empresaId: "${user.empresaId}"`);
      console.log(`  nomeEmpresa: "${user.nomeEmpresa}"`);
    });
    
    // 2. Verificar empresas e seus códigos
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nome: true,
        codigo: true
      }
    });
    
    console.log('\nEmpresas encontradas:');
    empresas.forEach(empresa => {
      console.log(`- ${empresa.nome}:`);
      console.log(`  id: "${empresa.id}"`);
      console.log(`  codigo: "${empresa.codigo}"`);
    });
    
    // 3. Verificar se há inconsistências
    console.log('\nVerificando inconsistências:');
    
    for (const user of users) {
      if (user.empresaId) {
        const empresa = empresas.find(e => e.id === user.empresaId);
        if (empresa) {
          if (user.codigoEmpresa !== empresa.codigo) {
            console.log(`❌ INCONSISTÊNCIA: Usuário ${user.name} tem codigoEmpresa="${user.codigoEmpresa}" mas a empresa tem codigo="${empresa.codigo}"`);
          } else {
            console.log(`✅ OK: Usuário ${user.name} tem codigoEmpresa="${user.codigoEmpresa}" igual ao da empresa`);
          }
        } else {
          console.log(`❌ ERRO: Usuário ${user.name} tem empresaId="${user.empresaId}" mas empresa não encontrada`);
        }
      } else {
        console.log(`ℹ️  Usuário ${user.name} não tem empresaId`);
      }
    }
    
    // 4. Verificar se há usuários com codigoEmpresa mas sem empresaId
    const usersWithCodigoButNoEmpresa = users.filter(u => u.codigoEmpresa && !u.empresaId);
    if (usersWithCodigoButNoEmpresa.length > 0) {
      console.log('\n⚠️  Usuários com codigoEmpresa mas sem empresaId:');
      usersWithCodigoButNoEmpresa.forEach(user => {
        console.log(`- ${user.name}: codigoEmpresa="${user.codigoEmpresa}"`);
      });
    }
    
  } catch (error) {
    console.error('Erro ao verificar código da empresa:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCodigoEmpresa(); 