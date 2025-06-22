const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateOrganizers() {
  try {
    console.log('🔄 Iniciando migração de organizadores...');

    // 1. Criar uma empresa padrão se não existir
    let defaultCompany = await prisma.company.findFirst({
      where: { name: 'Empresa Padrão' }
    });

    if (!defaultCompany) {
      defaultCompany = await prisma.company.create({
        data: {
          name: 'Empresa Padrão'
        }
      });
      console.log('✅ Empresa padrão criada:', defaultCompany.name);
    } else {
      console.log('ℹ️ Empresa padrão já existe:', defaultCompany.name);
    }

    // 2. Atualizar usuários existentes para pertencer à empresa padrão
    const usersWithoutCompany = await prisma.user.findMany({
      where: {
        companyId: null
      }
    });

    if (usersWithoutCompany.length > 0) {
      await prisma.user.updateMany({
        where: {
          companyId: null
        },
        data: {
          companyId: defaultCompany.id
        }
      });
      console.log(`✅ ${usersWithoutCompany.length} usuários associados à empresa padrão`);
    }

    // 3. Atualizar eventos existentes para pertencer à empresa padrão
    const eventsWithoutCompany = await prisma.event.findMany({
      where: {
        companyId: null
      }
    });

    if (eventsWithoutCompany.length > 0) {
      await prisma.event.updateMany({
        where: {
          companyId: null
        },
        data: {
          companyId: defaultCompany.id
        }
      });
      console.log(`✅ ${eventsWithoutCompany.length} eventos associados à empresa padrão`);
    }

    // 4. Adicionar organizadores aos eventos existentes
    const eventsWithoutOrganizers = await prisma.event.findMany({
      where: {
        organizers: {
          none: {}
        }
      },
      include: {
        user: true
      }
    });

    console.log(`📋 Encontrados ${eventsWithoutOrganizers.length} eventos sem organizadores`);

    for (const event of eventsWithoutOrganizers) {
      // Verificar se já existe um organizador para este evento/usuário
      const existingOrganizer = await prisma.eventOrganizer.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: event.userId
          }
        }
      });

      if (!existingOrganizer) {
        await prisma.eventOrganizer.create({
          data: {
            eventId: event.id,
            userId: event.userId,
            role: 'OWNER' // O criador do evento é o dono
          }
        });
        console.log(`✅ Organizador OWNER adicionado ao evento: ${event.name}`);
      }
    }

    // 5. Verificar se todos os eventos têm pelo menos um organizador
    const eventsWithOrganizers = await prisma.event.findMany({
      include: {
        organizers: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log('\n📊 Resumo da migração:');
    console.log(`- Total de eventos: ${eventsWithOrganizers.length}`);
    
    for (const event of eventsWithOrganizers) {
      console.log(`  - ${event.name}: ${event.organizers.length} organizador(es)`);
      event.organizers.forEach(org => {
        console.log(`    * ${org.user.name} (${org.user.email}) - ${org.role}`);
      });
    }

    console.log('\n✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a migração se o script for chamado diretamente
if (require.main === module) {
  migrateOrganizers()
    .then(() => {
      console.log('🎉 Migração finalizada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na migração:', error);
      process.exit(1);
    });
}

module.exports = migrateOrganizers; 