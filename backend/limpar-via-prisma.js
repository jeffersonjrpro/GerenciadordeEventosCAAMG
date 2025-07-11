const prisma = require('./src/config/database');

async function limparBancoCompleto() {
  try {
    console.log('=== LIMPANDO BANCO DE DADOS VIA PRISMA ===');
    
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
    
    // 2. Deletar dados em ordem (respeitando chaves estrangeiras)
    console.log('\n2. Deletando dados...');
    
    // Deletar check-ins primeiro
    const checkInsDeleted = await prisma.checkIn.deleteMany();
    console.log(`Check-ins deletados: ${checkInsDeleted.count}`);
    
    // Deletar convidados
    const guestsDeleted = await prisma.guest.deleteMany();
    console.log(`Convidados deletados: ${guestsDeleted.count}`);
    
    // Deletar eventos
    const eventsDeleted = await prisma.event.deleteMany();
    console.log(`Eventos deletados: ${eventsDeleted.count}`);
    
    // Deletar usuários
    const usersDeleted = await prisma.user.deleteMany();
    console.log(`Usuários deletados: ${usersDeleted.count}`);
    
    // Deletar empresas
    const empresasDeleted = await prisma.empresa.deleteMany();
    console.log(`Empresas deletadas: ${empresasDeleted.count}`);
    
    // Deletar notificações
    const notificationsDeleted = await prisma.notification.deleteMany();
    console.log(`Notificações deletadas: ${notificationsDeleted.count}`);
    
    // Deletar arquivos
    const filesDeleted = await prisma.file.deleteMany();
    console.log(`Arquivos deletados: ${filesDeleted.count}`);
    
    // Deletar demandas
    const demandsDeleted = await prisma.demand.deleteMany();
    console.log(`Demandas deletadas: ${demandsDeleted.count}`);
    
    // Deletar categorias de demandas
    const demandCategoriesDeleted = await prisma.demandCategory.deleteMany();
    console.log(`Categorias de demandas deletadas: ${demandCategoriesDeleted.count}`);
    
    // Deletar agendamentos
    const schedulesDeleted = await prisma.schedule.deleteMany();
    console.log(`Agendamentos deletados: ${schedulesDeleted.count}`);
    
    // Deletar configurações
    const configsDeleted = await prisma.config.deleteMany();
    console.log(`Configurações deletadas: ${configsDeleted.count}`);
    
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

limparBancoCompleto(); 