const prisma = require('./src/config/database');

async function testEventsFixed() {
  try {
    console.log('🔍 Testando correções na listagem de eventos...');
    
    // 1. Buscar usuários com diferentes roles/níveis
    const users = await prisma.user.findMany({
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
      },
      take: 3
    });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado para teste');
      return;
    }
    
    console.log('👥 Usuários de teste:', users.map(u => ({
      name: u.name,
      role: u.role,
      nivel: u.nivel,
      empresaId: u.empresaId
    })));
    
    // 2. Criar eventos de teste para diferentes usuários
    const testEvents = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const eventData = {
        name: `Evento Teste ${user.name} ${Date.now()}`,
        description: `Descrição do evento de teste para ${user.name}`,
        date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // Dias diferentes
        location: `Local de Teste ${i + 1}`,
        maxGuests: 50 + i * 10,
        customFields: {},
        customSlug: `evento-teste-${user.name}-${Date.now()}`
      };
      
      console.log(`📝 Criando evento para ${user.name}:`, eventData.name);
      
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
      
      testEvents.push({ event, user });
      console.log(`✅ Evento criado para ${user.name}:`, event.id);
    }
    
    // 3. Testar listagem para cada usuário
    for (const { event, user } of testEvents) {
      console.log(`\n🔍 Testando listagem para ${user.name} (${user.role}/${user.nivel}):`);
      
      // Simular a lógica do getUserEvents
      let where = {};
      if (user.empresaId) {
        where.empresaId = user.empresaId;
      } else {
        where.userId = user.id;
      }
      
      const userEvents = await prisma.event.findMany({
        where,
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
        },
        orderBy: {
          date: 'desc'
        }
      });
      
      console.log(`📊 ${user.name} pode ver ${userEvents.length} eventos:`);
      userEvents.forEach(evt => {
        console.log(`  - ${evt.name} (Criador: ${evt.user.name})`);
      });
    }
    
    // 4. Testar estatísticas
    console.log('\n📊 Testando estatísticas...');
    const empresaId = users[0].empresaId;
    if (empresaId) {
      const stats = await prisma.event.count({
        where: { empresaId }
      });
      console.log(`📈 Total de eventos da empresa: ${stats}`);
    }
    
    // 5. Limpar eventos de teste
    console.log('\n🧹 Limpando eventos de teste...');
    for (const { event } of testEvents) {
      await prisma.event.delete({
        where: { id: event.id }
      });
    }
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEventsFixed(); 