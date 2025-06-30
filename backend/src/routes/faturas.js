const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const faturaService = require('../services/faturaService');

// Buscar faturas da empresa do usuário
router.get('/', auth, async (req, res) => {
  try {
    const faturas = await faturaService.getFaturasByEmpresaId(req.user.empresaId);
    res.json({ success: true, data: faturas });
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Buscar fatura específica
router.get('/:faturaId', auth, async (req, res) => {
  try {
    const fatura = await faturaService.getFaturaById(req.params.faturaId);
    
    if (!fatura) {
      return res.status(404).json({ success: false, message: 'Fatura não encontrada' });
    }
    
    // Verificar se a fatura pertence à empresa do usuário
    if (fatura.empresaId !== req.user.empresaId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para acessar esta fatura' });
    }
    
    res.json({ success: true, data: fatura });
  } catch (error) {
    console.error('Erro ao buscar fatura:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Pagar fatura
router.post('/:faturaId/pagar', auth, async (req, res) => {
  try {
    const fatura = await faturaService.getFaturaById(req.params.faturaId);
    
    if (!fatura) {
      return res.status(404).json({ success: false, message: 'Fatura não encontrada' });
    }
    
    // Verificar se a fatura pertence à empresa do usuário
    if (fatura.empresaId !== req.user.empresaId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para pagar esta fatura' });
    }
    
    // Verificar se a fatura já foi paga
    if (fatura.status === 'PAGO') {
      return res.status(400).json({ success: false, message: 'Fatura já foi paga' });
    }
    
    const faturaPaga = await faturaService.marcarComoPaga(req.params.faturaId);
    res.json({ success: true, data: faturaPaga, message: 'Pagamento processado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({ success: false, message: error.message || 'Erro interno do servidor' });
  }
});

// Download da fatura (placeholder)
router.get('/:faturaId/download', auth, async (req, res) => {
  try {
    const fatura = await faturaService.getFaturaById(req.params.faturaId);
    
    if (!fatura) {
      return res.status(404).json({ success: false, message: 'Fatura não encontrada' });
    }
    
    // Verificar se a fatura pertence à empresa do usuário
    if (fatura.empresaId !== req.user.empresaId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para baixar esta fatura' });
    }
    
    // TODO: Implementar geração de PDF da fatura
    // Por enquanto, retornar dados em JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fatura-${fatura.id}.json"`);
    res.json(fatura);
  } catch (error) {
    console.error('Erro ao baixar fatura:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Visualizar fatura
router.get('/:faturaId/visualizar', auth, async (req, res) => {
  try {
    const fatura = await faturaService.getFaturaById(req.params.faturaId);
    
    if (!fatura) {
      return res.status(404).json({ success: false, message: 'Fatura não encontrada' });
    }
    
    // Verificar se a fatura pertence à empresa do usuário
    if (fatura.empresaId !== req.user.empresaId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para visualizar esta fatura' });
    }
    
    res.json({ success: true, data: fatura });
  } catch (error) {
    console.error('Erro ao visualizar fatura:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

module.exports = router; 