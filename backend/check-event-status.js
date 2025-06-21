const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEventStatus() {
  try {
    const eventId = 'cmc6lbjph000113vxrkrf0hzv';
    
    console.log('Verificando status do evento:', eventId);
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        isActive: true,
        isPublic: true,
        registrationPaused: true,
        registrationPauseUntil: true
      }
    });
    
    if (!event) {
      console.log('❌ Evento não encontrado no banco de dados');
      return;
    }
    
    console.log('✅ Evento encontrado:');
    console.log('  - Nome:', event.name);
    console.log('  - isActive:', event.isActive);
    console.log('  - isPublic:', event.isPublic);
    console.log('  - registrationPaused:', event.registrationPaused);
    console.log('  - registrationPauseUntil:', event.registrationPauseUntil);
    
    // Testar getPublicEvent
    console.log('\n🧪 Testando getPublicEvent...');
    try {
      const publicEvent = await prisma.event.findFirst({
        where: {
          id: eventId,
          isActive: true,
          isPublic: true
        }
      });
      
      if (publicEvent) {
        console.log('✅ getPublicEvent retornou o evento');
      } else {
        console.log('❌ getPublicEvent não retornou o evento');
        console.log('  - isActive:', event.isActive);
        console.log('  - isPublic:', event.isPublic);
      }
    } catch (error) {
      console.log('❌ Erro ao testar getPublicEvent:', error.message);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEventStatus(); 