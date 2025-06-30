const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Inicializa estruturas necessárias no banco de dados
 * Este script sempre roda quando o servidor inicia
 */
async function initializeDatabase() {
  try {
    console.log('🔧 Verificando estruturas do banco de dados...');
    
    // 1. Verificar e criar sequência para números de solicitação
    await ensureSolicitacaoSequence();
    
    console.log('✅ Inicialização do banco concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na inicialização do banco:', error);
    // Não falhar o servidor por causa disso
  }
}

/**
 * Garante que a sequência de números de solicitação existe
 */
async function ensureSolicitacaoSequence() {
  try {
    // Tentar usar a sequência para verificar se existe
    await prisma.$queryRaw`SELECT currval('demanda_solicitacao_seq')`;
    console.log('✅ Sequência demanda_solicitacao_seq já existe');
  } catch (error) {
    // Se a sequência não existir, criar ela
    if (error.message.includes('não existe') || error.message.includes('does not exist')) {
      try {
        console.log('⚡ Criando sequência demanda_solicitacao_seq...');
        
        // Verificar o maior número já existente
        const maxSolicitacao = await prisma.demanda.aggregate({
          _max: { solicitacao: true }
        });
        
        let startValue = 1000;
        if (maxSolicitacao._max.solicitacao) {
          const maxNum = parseInt(maxSolicitacao._max.solicitacao);
          startValue = isNaN(maxNum) ? 1000 : maxNum + 1;
        }
        
        // Criar a sequência
        await prisma.$executeRaw`CREATE SEQUENCE IF NOT EXISTS demanda_solicitacao_seq START 1000;`;
        
        // Se houver um valor maior, ajustar a sequência
        if (startValue > 1000) {
          await prisma.$executeRawUnsafe(`SELECT setval('demanda_solicitacao_seq', ${startValue});`);
        }
        
        console.log(`✅ Sequência criada começando em ${startValue}`);
        
      } catch (createError) {
        console.error('❌ Erro ao criar sequência:', createError);
      }
    }
  }
}

module.exports = { initializeDatabase }; 