const prisma = require('./src/config/database');

async function fixCodigoEmpresa() {
  try {
    console.log('=== CORRIGINDO CÓDIGOS DE EMPRESA ===');
    
    // 1. Buscar todas as empresas
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nome: true,
        codigo: true
      }
    });
    
    console.log('Empresas encontradas:');
    empresas.forEach(empresa => {
      console.log(`- ${empresa.nome}: id="${empresa.id}", codigo="${empresa.codigo}"`);
    });
    
    // 2. Buscar usuários que precisam de correção
    const users = await prisma.user.findMany({
      where: {
        empresaId: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        codigoEmpresa: true,
        empresaId: true,
        nomeEmpresa: true
      }
    });
    
    console.log('\nUsuários que precisam de correção:');
    let updatedCount = 0;
    
    for (const user of users) {
      const empresa = empresas.find(e => e.id === user.empresaId);
      
      if (empresa) {
        // Verificar se precisa atualizar
        if (user.codigoEmpresa !== empresa.codigo) {
          console.log(`\nAtualizando usuário ${user.name} (${user.email}):`);
          console.log(`  codigoEmpresa atual: "${user.codigoEmpresa}"`);
          console.log(`  codigoEmpresa correto: "${empresa.codigo}"`);
          
          // Atualizar o usuário
          await prisma.user.update({
            where: { id: user.id },
            data: {
              codigoEmpresa: empresa.codigo,
              nomeEmpresa: empresa.nome
            }
          });
          
          console.log(`  ✅ Atualizado com sucesso!`);
          updatedCount++;
        } else {
          console.log(`✅ Usuário ${user.name} já tem codigoEmpresa correto: "${user.codigoEmpresa}"`);
        }
      } else {
        console.log(`❌ ERRO: Usuário ${user.name} tem empresaId="${user.empresaId}" mas empresa não encontrada`);
      }
    }
    
    console.log(`\n=== RESUMO ===`);
    console.log(`Total de usuários atualizados: ${updatedCount}`);
    
    // 3. Verificar resultado final
    console.log('\nVerificação final:');
    const finalUsers = await prisma.user.findMany({
      where: {
        empresaId: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        codigoEmpresa: true,
        empresaId: true,
        nomeEmpresa: true
      }
    });
    
    for (const user of finalUsers) {
      const empresa = empresas.find(e => e.id === user.empresaId);
      if (empresa && user.codigoEmpresa === empresa.codigo) {
        console.log(`✅ ${user.name}: codigoEmpresa="${user.codigoEmpresa}" (correto)`);
      } else {
        console.log(`❌ ${user.name}: codigoEmpresa="${user.codigoEmpresa}" (INCORRETO)`);
      }
    }
    
  } catch (error) {
    console.error('Erro ao corrigir código da empresa:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCodigoEmpresa(); 