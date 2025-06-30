// Middleware de autenticação e autorização para painel master admin
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

module.exports = async function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Busca o admin master
    const admin = await prisma.adminMaster.findUnique({
      where: { id: decoded.id, ativo: true },
    });
    if (!admin) return res.status(403).json({ error: 'Acesso restrito ao painel master' });
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}; 