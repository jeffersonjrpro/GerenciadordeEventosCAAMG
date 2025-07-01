const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');
const { execSync } = require('child_process');

// Listar setores da empresa
router.get('/setores', authenticateToken, async (req, res) => {
  const user = req.user;
  const setores = await prisma.setor.findMany({ where: { empresaId: user.empresaId } });
  res.json(setores);
});

// Criar setor (apenas admin)
router.post('/setores', authenticateToken, async (req, res) => {
  const user = req.user;
  if (user.nivel !== 'ADMIN' && user.nivel !== 'PROPRIETARIO') return res.status(403).json({ error: 'Acesso negado' });
  const setor = await prisma.setor.create({ data: { nome: req.body.nome, empresaId: user.empresaId } });
  res.json(setor);
});

// Listar demandas (com filtros)
router.get('/demandas', authenticateToken, async (req, res) => {
  const user = req.user;
  const { setorId, status, prioridade, nomeProjeto, solicitacao, page = 1, limit = 10 } = req.query;
  const where = { setor: { empresaId: user.empresaId } };
  if (setorId) where.setorId = setorId;
  if (status) where.status = status;
  if (prioridade) where.prioridade = prioridade;
  if (nomeProjeto) where.nomeProjeto = { contains: nomeProjeto, mode: 'insensitive' };
  if (solicitacao) where.solicitacao = solicitacao;
  let pageNum = parseInt(page);
  let limitNum = parseInt(limit);
  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;
  const [demandas, total] = await Promise.all([
    prisma.demanda.findMany({
      where,
      include: { setor: true, responsaveis: true, observacoes: true },
      skip,
      take
    }),
    prisma.demanda.count({ where })
  ]);
  res.json({ demandas, total });
});

async function proximoNumeroSolicitacao() {
  try {
    // Tentar obter o próximo número da sequência
    const result = await prisma.$queryRaw`SELECT nextval('demanda_solicitacao_seq') as numero`;
    return Array.isArray(result) ? result[0].numero : result.numero;
  } catch (error) {
    // Se a sequência não existir, criar ela e tentar novamente
    if (error.code === 'P2010' || error.message.includes('não existe')) {
      try {
        console.log('⚡ Criando sequência demanda_solicitacao_seq automaticamente...');
        
        // Verificar o maior número já existente nas demandas
        const maxSolicitacao = await prisma.demanda.aggregate({
          _max: { solicitacao: true }
        });
        
        let startValue = 1000; // Valor padrão
        if (maxSolicitacao._max.solicitacao) {
          // Se já existem demandas, começar do próximo número
          const maxNum = parseInt(maxSolicitacao._max.solicitacao);
          startValue = isNaN(maxNum) ? 1000 : maxNum + 1;
        }
        
        // Criar a sequência começando do valor calculado
        await prisma.$executeRaw`CREATE SEQUENCE demanda_solicitacao_seq START ${startValue};`;
        console.log(`✅ Sequência criada começando em ${startValue}`);
        
        // Agora obter o próximo número
        const result = await prisma.$queryRaw`SELECT nextval('demanda_solicitacao_seq') as numero`;
        return Array.isArray(result) ? result[0].numero : result.numero;
        
      } catch (createError) {
        console.error('❌ Erro ao criar sequência:', createError);
        // Fallback: usar timestamp como número único
        return Date.now().toString().slice(-6);
      }
    }
    throw error;
  }
}

// Criar demanda (apenas admin)
router.post('/demandas', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 POST /demandas - Iniciando criação');
    console.log('🔍 POST /demandas - Dados recebidos:', req.body);
    
    const user = req.user;
    if (user.nivel !== 'ADMIN' && user.nivel !== 'PROPRIETARIO' && !user.podeGerenciarDemandas) {
      console.log('❌ POST /demandas - Acesso negado para usuário:', user.id);
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { nomeProjeto, descricao, solicitante, prioridade, status, dataEntrega, dataTermino, setorId, responsaveisIds, observacoesIniciais, linkPastaProjeto, linkSite, numeroFluig } = req.body;
    
    console.log('🔍 POST /demandas - setorId:', setorId);
    
    if (!setorId) {
      console.log('❌ POST /demandas - setorId é obrigatório');
      return res.status(400).json({ error: 'O campo setorId é obrigatório.' });
    }
    
    // Validação dos responsáveis
    let connectResponsaveis = [];
    if (responsaveisIds && responsaveisIds.length) {
      const idsArray = Array.isArray(responsaveisIds) ? responsaveisIds : [responsaveisIds];
      const count = await prisma.user.count({ where: { id: { in: idsArray } } });
      if (count !== idsArray.length) {
        console.log('❌ POST /demandas - Responsáveis não encontrados');
        return res.status(400).json({ error: 'Um ou mais responsáveis não existem.' });
      }
      connectResponsaveis = idsArray.map(id => ({ id }));
    }
    
    // Validação do setor
    const setorExiste = await prisma.setor.findUnique({ where: { id: setorId } });
    if (!setorExiste) {
      console.log('❌ POST /demandas - Setor não encontrado:', setorId);
      return res.status(400).json({ error: 'Setor não encontrado.' });
    }
    
    console.log('🔍 POST /demandas - Gerando número de solicitação');
    const numeroSolicitacao = await proximoNumeroSolicitacao();
    console.log('🔍 POST /demandas - Número gerado:', numeroSolicitacao);
    
    // Processar observações se fornecidas
    let observacoesData = undefined;
    if (observacoesIniciais && observacoesIniciais.length > 0) {
      // Filtrar apenas observações que têm texto
      const observacoesValidas = observacoesIniciais.filter(obs => obs.texto && obs.texto.trim());
      if (observacoesValidas.length > 0) {
        observacoesData = {
          create: observacoesValidas.map(obs => ({ 
            texto: obs.texto.trim(), 
            autorId: obs.autorId || user.id 
          }))
        };
      }
    }
    
    console.log('🔍 POST /demandas - Dados para criação:', {
      solicitacao: String(numeroSolicitacao),
      nomeProjeto,
      solicitante,
      prioridade: prioridade || 'MEDIA',
      status: status || 'ABERTO',
      setorId,
      criadoPorId: user.id,
      observacoesData
    });
    
    const demanda = await prisma.demanda.create({
      data: {
        solicitacao: String(numeroSolicitacao),
        numeroFluig: numeroFluig || null,
        nomeProjeto,
        descricao: descricao || null,
        solicitante,
        prioridade: prioridade || 'MEDIA',
        status: status || 'ABERTO',
        dataAbertura: new Date(),
        dataEntrega: dataEntrega ? new Date(dataEntrega + 'T00:00:00') : null,
        dataTermino: dataTermino ? new Date(dataTermino) : null,
        linkPastaProjeto,
        linkSite,
        setorId,
        responsaveis: { connect: connectResponsaveis },
        ...(observacoesData && { observacoes: observacoesData }),
        criadoPorId: user.id
      },
      include: { setor: true, responsaveis: true, observacoes: true }
    });
    
    console.log('✅ POST /demandas - Demanda criada com sucesso:', demanda.id);
    res.json(demanda);
  } catch (error) {
    console.error('❌ POST /demandas - Erro ao criar demanda:', error);
    console.error('❌ POST /demandas - Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Editar demanda (apenas admin)
router.put('/demandas/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 PUT /demandas/:id - Iniciando edição');
    console.log('🔍 PUT /demandas/:id - ID:', req.params.id);
    console.log('🔍 PUT /demandas/:id - Dados recebidos:', req.body);
    
    const user = req.user;
    if (user.nivel !== 'ADMIN' && user.nivel !== 'PROPRIETARIO' && !user.podeGerenciarDemandas) {
      console.log('❌ PUT /demandas/:id - Acesso negado para usuário:', user.id);
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { nomeProjeto, descricao, solicitante, prioridade, status, dataEntrega, setorId, responsaveisIds, numeroFluig, linkPastaProjeto, linkSite, observacoesIniciais } = req.body;
    
    // Validação dos responsáveis
    let setResponsaveis = [];
    if (responsaveisIds && responsaveisIds.length) {
      const idsArray = Array.isArray(responsaveisIds) ? responsaveisIds : [responsaveisIds];
      const count = await prisma.user.count({ where: { id: { in: idsArray } } });
      if (count !== idsArray.length) {
        console.log('❌ PUT /demandas/:id - Responsáveis não encontrados');
        return res.status(400).json({ error: 'Um ou mais responsáveis não existem.' });
      }
      setResponsaveis = idsArray.map(id => ({ id }));
    }

    // Processar observações se fornecidas
    let observacoesData = undefined;
    if (observacoesIniciais && observacoesIniciais.length > 0) {
      // Filtrar apenas observações que têm texto
      const observacoesValidas = observacoesIniciais.filter(obs => obs.texto && obs.texto.trim());
      if (observacoesValidas.length > 0) {
        observacoesData = {
          create: observacoesValidas.map(obs => ({ 
            texto: obs.texto.trim(), 
            autorId: obs.autorId || user.id 
          }))
        };
      }
    }

    console.log('🔍 PUT /demandas/:id - Dados para atualização:', {
      nomeProjeto,
      solicitante,
      prioridade,
      status,
      setorId,
      observacoesData
    });

    const demanda = await prisma.demanda.update({
      where: { id: req.params.id },
      data: {
        nomeProjeto,
        descricao: descricao || null,
        solicitante,
        prioridade,
        status,
        dataEntrega: new Date(dataEntrega),
        setorId,
        responsaveis: { set: setResponsaveis },
        numeroFluig: numeroFluig || null,
        linkPastaProjeto: linkPastaProjeto || null,
        linkSite: linkSite || null,
        ...(observacoesData && { observacoes: observacoesData })
      },
      include: { setor: true, responsaveis: true, observacoes: { include: { autor: true } } }
    });
    
    console.log('✅ PUT /demandas/:id - Demanda atualizada com sucesso:', demanda.id);
    res.json(demanda);
  } catch (error) {
    console.error('❌ PUT /demandas/:id - Erro ao atualizar demanda:', error);
    console.error('❌ PUT /demandas/:id - Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Estatísticas de demandas por status (DEVE VIR ANTES DE /:id)
router.get('/demandas/estatisticas', authenticateToken, async (req, res) => {
  const user = req.user;
  
  try {
    // Buscar apenas demandas com setor válido e da empresa do usuário
    const setores = await prisma.setor.findMany({ where: { empresaId: user.empresaId }, select: { id: true } });
    const setoresIds = setores.map(s => s.id);
    
    const where = { setorId: { in: setoresIds } };
    const [abertas, emAndamento, concluidas, pausadas, total] = await Promise.all([
      prisma.demanda.count({ where: { ...where, status: 'ABERTO' } }),
      prisma.demanda.count({ where: { ...where, status: 'EM_ANDAMENTO' } }),
      prisma.demanda.count({ where: { ...where, status: 'CONCLUIDO' } }),
      prisma.demanda.count({ where: { ...where, status: 'PAUSADO' } }),
      prisma.demanda.count({ where })
    ]);
    res.json({ abertas, emAndamento, concluidas, pausadas, total });
  } catch (error) {
    console.error('Erro no endpoint estatisticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Excluir demanda (apenas ADMIN ou PROPRIETARIO)
router.delete('/demandas/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  if (user.nivel !== 'ADMIN' && user.nivel !== 'PROPRIETARIO' && !user.podeGerenciarDemandas) return res.status(403).json({ error: 'Acesso negado' });
  try {
    await prisma.demanda.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir demanda' });
  }
});

// Detalhes da demanda
router.get('/demandas/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  const demanda = await prisma.demanda.findUnique({
    where: { id: req.params.id },
    include: { setor: true, responsaveis: true, observacoes: { include: { autor: true } } }
  });
  if (!demanda || demanda.setor.empresaId !== user.empresaId) return res.status(404).json({ error: 'Demanda não encontrada' });
  res.json(demanda);
});

// Adicionar observação
router.post('/demandas/:id/observacoes', authenticateToken, async (req, res) => {
  const user = req.user;
  const { texto } = req.body;
  const demanda = await prisma.demanda.findUnique({ where: { id: req.params.id }, include: { responsaveis: true, setor: true } });
  if (!demanda || demanda.setor.empresaId !== user.empresaId) return res.status(404).json({ error: 'Demanda não encontrada' });
  if (!demanda.responsaveis.some(u => u.id === user.id)) return res.status(403).json({ error: 'Apenas responsáveis podem comentar' });
  const observacao = await prisma.observacao.create({
    data: { texto, autorId: user.id, demandaId: req.params.id }
  });
  res.json(observacao);
});

module.exports = router; 