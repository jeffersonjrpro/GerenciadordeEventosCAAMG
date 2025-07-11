const prisma = require('../config/database');
const path = require('path');

// Listar palestrantes de um evento
exports.list = async (req, res) => {
  const { eventId } = req.params;
  try {
    const palestrantes = await prisma.palestrante.findMany({
      where: { eventId },
      orderBy: { ordem: 'asc' }
    });
    res.json(palestrantes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar palestrantes', details: err.message });
  }
};

// Adicionar palestrante
exports.create = async (req, res) => {
  const { eventId } = req.params;
  const { nome, cargo, descricao, ordem, ativo } = req.body;
  let imagem = null;
  if (req.file) {
    imagem = `/uploads/events/${req.file.filename}`;
  }
  try {
    const palestrante = await prisma.palestrante.create({
      data: {
        nome,
        cargo,
        descricao: descricao || '',
        ordem: parseInt(ordem) || 0,
        ativo: ativo === 'true' || ativo === true,
        imagem,
        eventId
      }
    });
    res.status(201).json(palestrante);
  } catch (err) {
    console.error('❌ Erro ao criar palestrante:', err);
    res.status(500).json({ error: 'Erro ao criar palestrante', details: err.message });
  }
};

// Editar palestrante
exports.update = async (req, res) => {
  const { eventId, palestranteId } = req.params;
  const { nome, cargo, descricao, ordem, ativo } = req.body;
  let imagem = null;
  if (req.file) {
    imagem = `/uploads/events/${req.file.filename}`;
  }
  try {
    const updateData = {
      nome,
      cargo,
      descricao: descricao || '',
      ordem: parseInt(ordem) || 0,
      ativo: ativo === 'true' || ativo === true
    };
    
    if (imagem) {
      updateData.imagem = imagem;
    }
    
    const palestrante = await prisma.palestrante.update({
      where: { id: palestranteId },
      data: updateData
    });
    res.json(palestrante);
  } catch (err) {
    console.error('❌ Erro ao atualizar palestrante:', err);
    res.status(500).json({ error: 'Erro ao atualizar palestrante', details: err.message });
  }
};

// Remover palestrante
exports.remove = async (req, res) => {
  const { eventId, palestranteId } = req.params;
  try {
    await prisma.palestrante.delete({
      where: { id: palestranteId, eventId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover palestrante', details: err.message });
  }
}; 