const empresaService = require('../../services/admin/empresaService');

exports.list = async (req, res) => {
  try {
    const isMaster = !!req.admin;
    const userId = isMaster ? null : req.user.id;
    const empresas = await empresaService.listEmpresas(userId, isMaster);
    res.json(empresas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar empresas' });
  }
};

exports.create = async (req, res) => {
  try {
    const isMaster = !!req.admin;
    const userId = isMaster ? null : req.user.id;
    const empresa = await empresaService.createEmpresa(req.body, userId, isMaster);
    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
};

exports.update = async (req, res) => {
  try {
    const empresa = await empresaService.updateEmpresa(req.params.id, req.body);
    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
};

exports.block = async (req, res) => {
  try {
    const empresa = await empresaService.blockEmpresa(req.params.id);
    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao bloquear empresa' });
  }
};

exports.get = async (req, res) => {
  try {
    const empresa = await empresaService.getEmpresa(req.params.id);
    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
};

exports.delete = async (req, res) => {
  try {
    await empresaService.deleteEmpresa(req.params.id);
    res.json({ message: 'Empresa excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir empresa' });
  }
}; 