const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const empresaController = require('../controllers/admin/empresaController');

// Retorna os dados da empresa pelo ID
router.get('/empresas/:id', async (req, res) => {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: req.params.id }
    });
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

// Rota para buscar empresa pelo código único
router.get('/empresa-codigo/:codigo', empresaController.getByCodigo);

module.exports = router; 