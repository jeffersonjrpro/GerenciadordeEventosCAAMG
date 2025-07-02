const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar inicialização do banco
const { initializeDatabase } = require('./config/init');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const checkInRoutes = require('./routes/checkin');
const publicRoutes = require('./routes/public');
const guestRoutes = require('./routes/guests');
const organizerRoutes = require('./routes/organizers');
const subEventoRoutes = require('./routes/subeventos');
const adminRoutes = require('./routes/admin');
const faturaRoutes = require('./routes/faturas');
const demandasRoutes = require('./routes/demandas');
const empresasRoutes = require('./routes/empresas');
const notificationRoutes = require('./routes/notifications');
const agendamentoRoutes = require('./routes/agendamentos');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar trust proxy para funcionar com rate limiting atrás de proxy/load balancer
app.set('trust proxy', 1);

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["'self'", "http://localhost:3000"],
      "img-src": ["'self'", "data:", "blob:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://seusite.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting - habilitado em produção
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de 100 requests por IP
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
  });
  app.use('/api/', limiter);
}

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/checkin', checkInRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/faturas', faturaRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.use('/api', subEventoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', demandasRoutes);
app.use('/api', empresasRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/agendamentos', agendamentoRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Token inválido ou expirado'
    });
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Inicialização do servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API disponível em: http://localhost:${PORT}/api`);
  
  // Verificar conexão com banco e inicializar estruturas
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Inicializar estruturas necessárias
    await initializeDatabase();
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error);
  }
});

module.exports = app; 