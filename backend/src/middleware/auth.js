const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso necessário' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        telefone: true,
        nomeEmpresa: true,
        nivel: true,
        ativo: true,
        empresaId: true,
        eventosIds: true,
        trabalharTodosEventos: true,
        podeGerenciarDemandas: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido' 
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno na autenticação' 
    });
  }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas administradores.' 
    });
  }
  next();
};

// Middleware para verificar se é organizador ou admin
const requireOrganizer = (req, res, next) => {
  if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas organizadores ou administradores.' 
    });
  }
  next();
};

// Middleware opcional para autenticação (não bloqueia se não tiver token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          telefone: true,
          nomeEmpresa: true,
          nivel: true,
          ativo: true,
          empresaId: true,
          eventosIds: true,
          trabalharTodosEventos: true,
          podeGerenciarDemandas: true
        }
      });
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Se houver erro no token, continua sem autenticação
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOrganizer,
  optionalAuth
}; 