const prisma = require('./src/config/database');

async function limparBancoViaSQL() {
  try {
    console.log('=== LIMPANDO BANCO DE DADOS VIA SQL RAW ===');
    
    // 1. Verificar dados atuais
    console.log('\n1. Verificando dados atuais...');
    const usersCount = await prisma.user.count();
    const empresasCount = await prisma.empresa.count();
    const eventsCount = await prisma.event.count();
    
    console.log(`Usuários: ${usersCount}`);
    console.log(`Empresas: ${empresasCount}`);
    console.log(`Eventos: ${eventsCount}`);
    
    if (usersCount === 0 && empresasCount === 0) {
      console.log('✅ Banco já está limpo!');
      return;
    }
    
    // 2. Deletar dados usando SQL raw (ignora restrições)
    console.log('\n2. Deletando dados via SQL...');
    
    // Desabilitar verificação de chaves estrangeiras
    await prisma.$executeRaw`SET session_replication_role = replica;`;
    
    // Deletar todas as tabelas
    const tables = [
      'CheckIn',
      'Guest', 
      'Event',
      'User',
      'Empresa',
      'Notification',
      'File',
      'Demand',
      'DemandCategory',
      'Schedule',
      'Config'
    ];
    
    for (const table of tables) {
      try {
        const result = await prisma.$executeRaw`DELETE FROM "${table}";`;
        console.log(`✅ ${table} deletado`);
      } catch (error) {
        console.log(`ℹ️  ${table} não existe ou já foi deletado`);
      }
    }
    
    // Reabilitar verificação de chaves estrangeiras
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;
    
    // 3. Verificar resultado final
    console.log('\n3. Verificando resultado final...');
    const finalUsersCount = await prisma.user.count();
    const finalEmpresasCount = await prisma.empresa.count();
    const finalEventsCount = await prisma.event.count();
    
    console.log(`Usuários restantes: ${finalUsersCount}`);
    console.log(`Empresas restantes: ${finalEmpresasCount}`);
    console.log(`Eventos restantes: ${finalEventsCount}`);
    
    if (finalUsersCount === 0 && finalEmpresasCount === 0 && finalEventsCount === 0) {
      console.log('\n✅ BANCO DE DADOS LIMPO COM SUCESSO!');
      console.log('Agora você pode começar do zero!');
    } else {
      console.log('\n❌ Ainda há dados no banco!');
    }
    
  } catch (error) {
    console.error('Erro ao limpar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limparBancoViaSQL(); 