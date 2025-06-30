require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminMaster() {
  try {
    console.log('🔄 Criando admin master...');
    
    const senhaHash = await bcrypt.hash('SA.2@.nj--', 10);
    
    const admin = await prisma.adminMaster.create({
      data: {
        nome: 'Jefferson Júnio',
        email: 'jefferson-junio@hotmail.com',
        senha: senhaHash,
        nivel: 'MASTER',
        ativo: true,
      },
    });
    
    console.log('✅ Admin master criado com sucesso!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Senha: SA.2@.nj--');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Admin master já existe!');
      console.log('Tentando atualizar...');
      
      // Atualizar admin existente
      const senhaHash = await bcrypt.hash('SA.2@.nj--', 10);
      const admin = await prisma.adminMaster.update({
        where: { email: 'jefferson-junio@hotmail.com' },
        data: {
          nome: 'Jefferson Júnio',
          senha: senhaHash,
          nivel: 'MASTER',
          ativo: true,
        },
      });
      
      console.log('✅ Admin master atualizado com sucesso!');
      console.log('Email: jefferson-junio@hotmail.com');
      console.log('Senha: SA.2@.nj--');
      console.log('ID:', admin.id);
    } else {
      console.error('❌ Erro ao criar admin master:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminMaster(); 