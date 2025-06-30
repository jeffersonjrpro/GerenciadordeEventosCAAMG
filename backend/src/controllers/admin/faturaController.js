const faturaService = require('../../services/admin/faturaService');

exports.list = async (req, res) => {
  try {
    const faturas = await faturaService.listFaturas();
    res.json(faturas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
};

exports.create = async (req, res) => {
  try {
    const fatura = await faturaService.createFatura(req.body);
    res.json(fatura);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar fatura' });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const fatura = await faturaService.markFaturaPaid(req.params.id);
    res.json(fatura);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar fatura como paga' });
  }
}; 