const prisma = require('./src/config/database');

async function testEvents() {
  try {
    console.log('🔍 Testando criação e listagem de eventos...');
    
    // 1. Buscar um usuário para teste
    const user = await prisma.user.findFirst({
      where: { role: 'ORGANIZER' },
      select: { id: true, name: true, email: true, empresaId: true, role: true }
    });
    
    if (!user) {
      console.log('❌ Nenhum usuário ORGANIZER encontrado');
      return;
    }
    
    console.log('👤 Usuário de teste:', user);
    
    // 2. Criar um evento de teste
    const eventData = {
      name: 'Evento de Teste ' + Date.now(),
      description: 'Descrição do evento de teste',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      location: 'Local de Teste',
      maxGuests: 100,
      customFields: {},
      customSlug: 'evento-teste-' + Date.now()
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
        userId: user.id,
        empresaId: user.empresaId
      }
    });
    
    console.log('✅ Evento criado:', event.id);
    
    // 3. Adicionar o usuário como organizador OWNER
    await prisma.eventOrganizer.create({
      data: {
        eventId: event.id,
        userId: user.id,
        role: 'OWNER'
      }
    });
    
    console.log('✅ Organizador adicionado');
    
    // 4. Testar listagem de eventos do usuário
    console.log('🔍 Testando listagem de eventos...');
    
    const userEvents = await prisma.event.findMany({
      where: {
        OR: [
          { userId: user.id },
          { organizers: { some: { userId: user.id } } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organizers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            guests: true,
            checkIns: true
          }
        }
      }
    });
    
    console.log('📊 Eventos encontrados:', userEvents.length);
    userEvents.forEach(evt => {
      console.log(`  - ${evt.name} (ID: ${evt.id}, Criador: ${evt.user.name})`);
    });
    
    // 5. Testar com filtros de empresa
    console.log('🔍 Testando listagem por empresa...');
    
    const companyEvents = await prisma.event.findMany({
      where: { empresaId: user.empresaId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            guests: true,
            checkIns: true
          }
        }
      }
    });
    
    console.log('📊 Eventos da empresa:', companyEvents.length);
    
    // 6. Limpar evento de teste
    console.log('🧹 Limpando evento de teste...');
    await prisma.eventOrganizer.deleteMany({
      where: { eventId: event.id }
    });
    await prisma.event.delete({
      where: { id: event.id }
    });
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEvents(); 