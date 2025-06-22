const subEventoService = require('../services/subEventoService');

// Criar um novo subevento
const criarSubEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { nome, descricao, dataHora, local, limitePorConvidado } = req.body;

    if (!nome || !dataHora) {
      return res.status(400).json({
        success: false,
        error: 'Nome e data/hora são obrigatórios'
      });
    }

    const resultado = await subEventoService.criarSubEvento(eventoId, {
      nome,
      descricao,
      dataHora,
      local,
      limitePorConvidado
    });

    if (!resultado.success) {
      return res.status(400).json(resultado);
    }

    res.status(201).json(resultado);
  } catch (error) {
    console.error('Erro no controller criarSubEvento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Listar todos os subeventos de um evento
const listarSubEventos = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const resultado = await subEventoService.listarSubEventos(eventoId);

    if (!resultado.success) {
      return res.status(400).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro no controller listarSubEventos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Obter um subevento específico
const obterSubEvento = async (req, res) => {
  try {
    const { subEventoId } = req.params;

    const resultado = await subEventoService.obterSubEvento(subEventoId);

    if (!resultado.success) {
      return res.status(404).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro no controller obterSubEvento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Atualizar um subevento
const atualizarSubEvento = async (req, res) => {
  try {
    const { subEventoId } = req.params;
    const { nome, descricao, dataHora, local, limitePorConvidado } = req.body;

    const resultado = await subEventoService.atualizarSubEvento(subEventoId, {
      nome,
      descricao,
      dataHora,
      local,
      limitePorConvidado
    });

    if (!resultado.success) {
      return res.status(400).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro no controller atualizarSubEvento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Excluir um subevento
const excluirSubEvento = async (req, res) => {
  try {
    const { subEventoId } = req.params;

    const resultado = await subEventoService.excluirSubEvento(subEventoId);

    if (!resultado.success) {
      return res.status(400).json(resultado);
    }

    res.json({ success: true, message: 'Subevento excluído com sucesso' });
  } catch (error) {
    console.error('Erro no controller excluirSubEvento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Validar acesso ao subevento (registrar consumo)
const validarAcesso = async (req, res) => {
  try {
    const { subEventoId } = req.params;
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'QR Code é obrigatório'
      });
    }

    const resultado = await subEventoService.validarAcesso(subEventoId, qrCode);

    if (!resultado.success) {
      return res.status(400).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro no controller validarAcesso:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Obter relatório de consumo de um subevento
const obterRelatorioConsumo = async (req, res) => {
  try {
    const { subEventoId } = req.params;

    const resultado = await subEventoService.obterRelatorioConsumo(subEventoId);

    if (!resultado.success) {
      return res.status(404).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro no controller obterRelatorioConsumo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Obter estatísticas de todos os subeventos de um evento
const obterEstatisticasEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const resultado = await subEventoService.obterEstatisticasEvento(eventoId);

    if (!resultado.success) {
      return res.status(400).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro no controller obterEstatisticasEvento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  criarSubEvento,
  listarSubEventos,
  obterSubEvento,
  atualizarSubEvento,
  excluirSubEvento,
  validarAcesso,
  obterRelatorioConsumo,
  obterEstatisticasEvento
}; 