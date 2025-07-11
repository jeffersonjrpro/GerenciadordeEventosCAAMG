const prisma = require('./src/config/database');

async function testCreateEvent() {
  try {
    console.log('🔍 Criando evento de teste...');
    
    // Buscar um usuário para criar o evento
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
    
    // Criar evento de teste
    const eventData = {
      name: `Evento Teste ${Date.now()}`,
      description: 'Descrição do evento de teste',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      location: 'Local de Teste',
      maxGuests: 100,
      customFields: {},
      customSlug: `evento-teste-${Date.now()}`
    };
    
    console.log('📝 Criando evento:', eventData.name);
    
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
        isActive: true,
        userId: user.id,
        empresaId: user.empresaId
      }
    });
    
    console.log('✅ Evento criado:', event.id);
    console.log('✅ Evento criado:', event.name);
    
    // Testar se aparece na listagem
    console.log('\n🔍 Testando se aparece na listagem...');
    const EventService = require('./src/services/eventService');
    const result = await EventService.getUserEvents(user.id, { limit: 10 });
    
    console.log(`✅ Eventos encontrados: ${result.events.length}`);
    result.events.forEach((evt, index) => {
      console.log(`   ${index + 1}. ${evt.name} (ID: ${evt.id})`);
    });
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateEvent(); 