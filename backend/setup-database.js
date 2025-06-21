const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔧 Configurando banco de dados...');
  
  // Conectar ao PostgreSQL sem especificar o banco
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'JJgm@#$2012', // Você pode definir DB_PASSWORD no .env
    database: 'postgres' // Conectar ao banco padrão primeiro
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Verificar se o banco eventos_db existe
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'eventos_db'"
    );

    if (result.rows.length === 0) {
      console.log('📦 Criando banco de dados eventos_db...');
      await client.query('CREATE DATABASE eventos_db');
      console.log('✅ Banco eventos_db criado com sucesso!');
    } else {
      console.log('✅ Banco eventos_db já existe');
    }

  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Dica: Verifique se a senha do PostgreSQL está correta no arquivo .env');
      console.log('   Certifique-se de que a variável DB_PASSWORD está definida ou altere "sua_senha" pela senha correta');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Dica: Verifique se o PostgreSQL está rodando');
      console.log('   - No Windows, verifique se o serviço PostgreSQL está ativo');
      console.log('   - Ou inicie o pgAdmin para verificar a conexão');
    }
  } finally {
    await client.end();
  }
}

setupDatabase(); 