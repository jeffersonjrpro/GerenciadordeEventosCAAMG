const prisma = require('../../config/database');
const userService = require('../../services/userService');
const emailService = require('../../services/emailService');

exports.list = async (req, res) => {
  try {
    // Buscar apenas usuários comuns (role diferente de ADMIN)
    const usuarios = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' }
      },
      include: {
        empresa: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

exports.create = async (req, res) => {
  try {
    const usuario = await userService.criarUsuarioEquipe(req.body);
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao criar usuário' });
  }
};

exports.update = async (req, res) => {
  try {
    const usuario = await userService.atualizarUsuarioEquipe(req.params.userId, req.body);
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar usuário' });
  }
};

exports.block = async (req, res) => {
  try {
    // Bloqueio = set ativo: false, Desbloqueio = set ativo: true
    const { ativo } = req.body;
    await userService.atualizarUsuarioEquipe(req.params.userId, { ...req.body, ativo });
    res.json({ message: ativo ? 'Usuário desbloqueado' : 'Usuário bloqueado' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao bloquear/desbloquear usuário' });
  }
};

exports.get = async (req, res) => {
  try {
    const usuario = await userService.getUserById(req.params.userId);
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao buscar usuário' });
  }
};

exports.delete = async (req, res) => {
  try {
    await userService.removerUsuarioEquipe(req.params.userId, req.body.empresaId);
    res.json({ message: 'Usuário removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao remover usuário' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }
    const bcrypt = require('bcryptjs');
    const senhaHash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { password: senhaHash }
    });
    // Enviar e-mail de redefinição de senha
    await emailService.sendPasswordReset({ email: user.email, nome: user.name || user.nome, senha: newPassword });
    res.json({ message: 'Senha redefinida e e-mail enviado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
}; 