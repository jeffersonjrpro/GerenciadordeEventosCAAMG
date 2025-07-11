const prisma = require('./src/config/database');
const EventService = require('./src/services/eventService');

async function testFinal() {
  try {
    console.log('🔍 Teste Final - Verificando se as correções funcionaram...');
    
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
    
    // 2. Criar um evento de teste
    const eventData = {
      name: `Evento Final Teste ${Date.now()}`,
      description: 'Descrição do evento de teste final',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      location: 'Local de Teste Final',
      maxGuests: 50,
      customFields: {},
      customSlug: `evento-final-teste-${Date.now()}`
    };
    
    console.log('\n📝 Criando evento de teste...');
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
    
    // 3. Testar getUserEvents (usado pela página de eventos)
    console.log('\n🔍 Testando getUserEvents...');
    const result = await EventService.getUserEvents(user.id, { limit: 10 });
    console.log(`   Eventos retornados: ${result.events.length}`);
    const eventoEncontrado = result.events.find(e => e.id === event.id);
    if (eventoEncontrado) {
      console.log('✅ Evento aparece na listagem getUserEvents');
    } else {
      console.log('❌ Evento NÃO aparece na listagem getUserEvents');
    }
    
    // 4. Testar getEventById (usado para detalhes do evento)
    console.log('\n🔍 Testando getEventById...');
    try {
      const eventoDetalhes = await EventService.getEventById(event.id, user.id);
      console.log('✅ getEventById funcionou:', eventoDetalhes.name);
    } catch (error) {
      console.log('❌ getEventById falhou:', error.message);
    }
    
    // 5. Testar updateEvent
    console.log('\n🔍 Testando updateEvent...');
    try {
      const eventoAtualizado = await EventService.updateEvent(event.id, user.id, {
        name: eventData.name + ' - Atualizado'
      });
      console.log('✅ updateEvent funcionou:', eventoAtualizado.name);
    } catch (error) {
      console.log('❌ updateEvent falhou:', error.message);
    }
    
    // 6. Testar deleteEvent
    console.log('\n🔍 Testando deleteEvent...');
    try {
      const resultado = await EventService.deleteEvent(event.id, user.id);
      console.log('✅ deleteEvent funcionou:', resultado.message);
    } catch (error) {
      console.log('❌ deleteEvent falhou:', error.message);
    }
    
    console.log('\n✅ Teste final concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste final:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinal(); 