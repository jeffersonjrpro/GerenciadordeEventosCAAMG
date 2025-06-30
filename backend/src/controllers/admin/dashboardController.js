const dashboardService = require('../../services/admin/dashboardService');

exports.overview = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardOverview();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
}; 