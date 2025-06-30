const logService = require('../../services/admin/logService');

exports.list = async (req, res) => {
  try {
    const logs = await logService.listLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar logs' });
  }
}; 