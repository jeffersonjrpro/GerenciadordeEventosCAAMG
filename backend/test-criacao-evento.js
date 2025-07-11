const prisma = require('./src/config/database');

async function testCriacaoEvento() {
  try {
    console.log('🔍 Testando criação e listagem de evento...');
    
    // 1. Buscar um usuário para teste
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'ADMIN' },
          { role: 'ORGANIZER' },
          { nivel: 'CHECKIN' }
        ]
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        empresaId: true, 
        role: true,
        nivel: true
      }
    });
    
    if (!user) {
      console.log('❌ Nenhum usuário encontrado para teste');
      return;
    }
    
    console.log('👤 Usuário de teste:', user);
    
    // 2. Verificar eventos existentes antes da criação
    console.log('\n📊 Eventos existentes antes da criação:');
    const eventosAntes = await prisma.event.findMany({
      where: { empresaId: user.empresaId },
      select: { id: true, name: true, userId: true }
    });
    console.log(`   Total: ${eventosAntes.length} eventos`);
    eventosAntes.forEach(evt => {
      console.log(`   - ${evt.name} (ID: ${evt.id}, Criador: ${evt.userId})`);
    });
    
    // 3. Criar um evento de teste
    const eventData = {
      name: `Evento Teste ${Date.now()}`,
      description: 'Descrição do evento de teste',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      location: 'Local de Teste',
      maxGuests: 100,
      customFields: {},
      customSlug: `evento-teste-${Date.now()}`
    };
    
    console.log('\n📝 Criando evento:', eventData.name);
    
    const event = await prisma.event.create({
      data: {
        name: eventData.name,
        description: eventData.description,
        date: eventData.date,
        location: eventData.location,
        maxGuests: eventData.maxGuests,
        customFields: eventData.customFields,
        customSlug: eventData.customSlug,
        isPublic: true,
        userId: user.id,
        empresaId: user.empresaId
      }
    });
    
    console.log('✅ Evento criado:', event.id);
    
    // 4. Verificar eventos após a criação
    console.log('\n📊 Eventos após a criação:');
    const eventosDepois = await prisma.event.findMany({
      where: { empresaId: user.empresaId },
      select: { id: true, name: true, userId: true }
    });
    console.log(`   Total: ${eventosDepois.length} eventos`);
    eventosDepois.forEach(evt => {
      console.log(`   - ${evt.name} (ID: ${evt.id}, Criador: ${evt.userId})`);
    });
    
    // 5. Testar a lógica do getUserEvents
    console.log('\n🔍 Testando lógica do getUserEvents:');
    const EventService = require('./src/services/eventService');
    const result = await EventService.getUserEvents(user.id, { limit: 10 });
    console.log(`   Eventos retornados pelo getUserEvents: ${result.events.length}`);
    result.events.forEach((evt, index) => {
      console.log(`   ${index + 1}. ${evt.name} (ID: ${evt.id}, Criador: ${evt.user.name})`);
    });
    
    // 6. Limpar evento de teste
    console.log('\n🧹 Limpando evento de teste...');
    await prisma.event.delete({
      where: { id: event.id }
    });
    console.log('✅ Evento de teste removido');
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCriacaoEvento(); 