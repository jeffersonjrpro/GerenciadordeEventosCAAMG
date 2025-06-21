const { prisma } = require('./src/config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser() {
  try {
    console.log('🔧 Criando usuário administrador...');
    
    // Verificar se já existe um usuário admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@eventos.com'
      }
    });

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe!');
      console.log('📧 Email: admin@eventos.com');
      console.log('🔑 Senha: admin123');
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Criar usuário admin
    const adminUser = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@eventos.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📧 Email: admin@eventos.com');
    console.log('🔑 Senha: admin123');
    console.log('🆔 ID:', adminUser.id);

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 