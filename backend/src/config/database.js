// Carregar variáveis de ambiente ANTES de qualquer coisa
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Verificar se a variável está carregada
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Teste de conexão
prisma.$connect()
  .then(() => {
    console.log('✅ Conectado ao banco de dados');
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar ao banco:', error);
  });

module.exports = prisma; 