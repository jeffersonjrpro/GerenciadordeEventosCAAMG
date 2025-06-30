const planoService = require('../../services/admin/planoService');

exports.list = async (req, res) => {
  try {
    const planos = await planoService.listPlanos();
    res.json(planos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
};

exports.create = async (req, res) => {
  try {
    const plano = await planoService.createPlano(req.body);
    res.json(plano);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar plano' });
  }
};

exports.update = async (req, res) => {
  try {
    const plano = await planoService.updatePlano(req.params.id, req.body);
    res.json(plano);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
};

exports.delete = async (req, res) => {
  try {
    await planoService.deletePlano(req.params.id);
    res.json({ message: 'Plano excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir plano' });
  }
}; 