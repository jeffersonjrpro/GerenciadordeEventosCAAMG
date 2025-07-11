const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');
const { execSync } = require('child_process');
const { uploadDemandaArquivo, handleDemandaUploadError } = require('../middleware/upload');
const NotificationService = require('../services/notificationService');
const fs = require('fs');
const path = require('path');
const SMB2 = require('smb2');
const net = require('net');
// Função para conectar com servidor SMB
function conectarServidorArquivos() {
  return new SMB2({
    share: '\\\\caafiles-v\\App_Eventos',
    username: 'eventos',
    password: 'Caa.@silver25',
    domain: 'caamg',
    autoCloseTimeout: 0
  });
}

async function testarConexaoArquivos() {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    client.setTimeout(5000);

    client.connect(445, 'caafiles-v', () => {
      console.log('✅ Conexão TCP estabelecida com caafiles-v:445');
      client.destroy();

      const smbClient = conectarServidorArquivos();

      smbClient.readdir('', (err, files) => {
        if (err) {
          console.error('❌ Erro ao listar arquivos:', err);
          reject(err);
        } else {
          console.log('✅ Arquivos encontrados:', files);
          resolve(files);
        }
        smbClient.close();
      });
    });

    client.on('error', (err) => {
      console.error('❌ Erro de rede:', err);
      reject(err);
    });

    client.on('timeout', () => {
      console.error('❌ Timeout na conexão');
      client.destroy();
      reject(new Error('Timeout na conexão de rede'));
    });
  });
}


// Função para salvar arquivo no servidor SMB
async function salvarArquivoServidor(pastaDemanda, nomeArquivo, buffer) {
  return new Promise((resolve, reject) => {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      console.error('❌ Buffer inválido ao tentar salvar arquivo:', nomeArquivo);
      return reject(new Error('Arquivo inválido: buffer não recebido corretamente.'));
    }
    const smbClient = conectarServidorArquivos();
    
    // Sanitizar o nome da pasta e do arquivo para remover caracteres inválidos
    const pastaDemandaLimpa = pastaDemanda.toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    const nomeArquivoLimpo = nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    const caminhoPasta = `${pastaDemandaLimpa}`;
    const caminhoArquivoComPasta = `${pastaDemandaLimpa}/${nomeArquivoLimpo}`;
    
    console.log('🔍 Criando pasta da demanda e salvando arquivo:', {
      pasta: caminhoPasta,
      arquivo: caminhoArquivoComPasta
    });
    
    // Primeiro criar a pasta da demanda
    smbClient.mkdir(caminhoPasta, (err) => {
      if (err && err.code !== 'EEXIST') {
        console.error('❌ Erro ao criar pasta da demanda:', err);
        
        // Se não conseguir criar pasta, tentar salvar na raiz como fallback
        console.log('🔍 Tentando salvar na raiz como fallback...');
        smbClient.writeFile(nomeArquivoLimpo, buffer, (err) => {
          if (err) {
            console.error('❌ Erro ao salvar arquivo na raiz:', err);
            
            // Fallback: salvar localmente
            console.log('🔍 Salvando arquivo localmente como fallback...');
            const fs = require('fs');
            const path = require('path');
            const pastaLocal = path.join(__dirname, '..', '..', 'uploads', pastaDemandaLimpa);
            if (!fs.existsSync(pastaLocal)) {
              fs.mkdirSync(pastaLocal, { recursive: true });
            }
            const caminhoLocal = path.join(pastaLocal, nomeArquivoLimpo);
            fs.writeFileSync(caminhoLocal, buffer);
            console.log('✅ Arquivo salvo localmente:', caminhoLocal);
            resolve(`local:${caminhoLocal}`);
          } else {
            console.log('✅ Arquivo salvo com sucesso na raiz:', nomeArquivoLimpo);
            resolve(nomeArquivoLimpo);
          }
          smbClient.close();
        });
        return;
      }
      
      console.log('✅ Pasta da demanda criada/verificada');
      
      // Agora salvar o arquivo na pasta da demanda
      smbClient.writeFile(caminhoArquivoComPasta, buffer, (err) => {
        if (err) {
          console.error('❌ Erro ao salvar arquivo na pasta da demanda:', err);
          reject(err);
        } else {
          console.log('✅ Arquivo salvo com sucesso na pasta da demanda:', caminhoArquivoComPasta);
          resolve(caminhoArquivoComPasta);
        }
        smbClient.close();
      });
    });
  });
}

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
  const { setorId, status, prioridade, nomeProjeto, solicitacao, responsavelId, arquivada, page = 1, limit = 10 } = req.query;
  const where = { setor: { empresaId: user.empresaId } };
  
  // Por padrão, mostrar apenas demandas não arquivadas
  if (arquivada === undefined || arquivada === 'false') {
    where.arquivada = false;
  } else if (arquivada === 'true') {
    where.arquivada = true;
  }
  
  if (setorId) where.setorId = setorId;
  if (status) where.status = status;
  if (prioridade) where.prioridade = prioridade;
  if (nomeProjeto) where.nomeProjeto = { contains: nomeProjeto, mode: 'insensitive' };
  if (solicitacao) where.solicitacao = solicitacao;
  if (responsavelId) {
    where.responsaveis = {
      some: {
        id: responsavelId
      }
    };
  }
  let pageNum = parseInt(page);
  let limitNum = parseInt(limit);
  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;
  const [demandas, total] = await Promise.all([
    prisma.demanda.findMany({
      where,
      include: { 
        setor: true, 
        responsaveis: true, 
        observacoes: true,
        arquivos: {
          include: {
            uploadPor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      skip,
      take,
      orderBy: { dataAbertura: 'desc' }
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
    
    const { nomeProjeto, descricao, solicitante, prioridade, status, dataEntrega, dataTermino, setorId, responsaveisIds, observacoesIniciais, linkPastaProjeto, linkSite, numeroFluig, numeroSolicitacao } = req.body;
    
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
    
    // Usar número de solicitação fornecido ou gerar novo
    let numeroSolicitacaoFinal;
    if (numeroSolicitacao) {
      numeroSolicitacaoFinal = String(numeroSolicitacao);
    } else {
      console.log('🔍 POST /demandas - Gerando número de solicitação');
      numeroSolicitacaoFinal = await proximoNumeroSolicitacao();
      console.log('🔍 POST /demandas - Número gerado:', numeroSolicitacaoFinal);
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
    
    console.log('🔍 POST /demandas - Dados para criação:', {
      solicitacao: numeroSolicitacaoFinal,
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
        solicitacao: numeroSolicitacaoFinal,
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
      include: { 
        setor: true, 
        responsaveis: true, 
        observacoes: true,
        criadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('✅ POST /demandas - Demanda criada com sucesso:', demanda.id);
    
    // Enviar notificações para os responsáveis (se houver)
    if (demanda.responsaveis && demanda.responsaveis.length > 0) {
      try {
        await NotificationService.createDemandaNotification(demanda, demanda.responsaveis);
        console.log('✅ POST /demandas - Notificações enviadas para os responsáveis');
      } catch (notificationError) {
        console.error('⚠️ POST /demandas - Erro ao enviar notificações:', notificationError);
        // Não falhar a criação da demanda se as notificações falharem
      }
    }
    
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
    
    // Primeiro verificar se a demanda existe e se o usuário tem permissão
    const demandaExistente = await prisma.demanda.findFirst({
      where: { 
        id: req.params.id,
        OR: [
          { setor: { empresaId: user.empresaId } },
          { setorId: null, criadoPorId: user.id }
        ]
      }
    });
    
    if (!demandaExistente) {
      console.log('❌ PUT /demandas/:id - Demanda não encontrada ou sem permissão');
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }
    
    console.log('✅ PUT /demandas/:id - Demanda encontrada, prosseguindo com edição');
    
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
    const whereNaoArquivadas = { ...where, arquivada: false };
    const whereArquivadas = { ...where, arquivada: true };
    
    const [abertas, emAndamento, concluidas, pausadas, total, arquivadas] = await Promise.all([
      prisma.demanda.count({ where: { ...whereNaoArquivadas, status: 'ABERTO' } }),
      prisma.demanda.count({ where: { ...whereNaoArquivadas, status: 'EM_ANDAMENTO' } }),
      prisma.demanda.count({ where: { ...whereNaoArquivadas, status: 'CONCLUIDO' } }),
      prisma.demanda.count({ where: { ...whereNaoArquivadas, status: 'PAUSADO' } }),
      prisma.demanda.count({ where: whereNaoArquivadas }),
      prisma.demanda.count({ where: whereArquivadas })
    ]);
    res.json({ abertas, emAndamento, concluidas, pausadas, total, arquivadas });
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
  try {
    console.log('🔍 GET /demandas/:id - Buscando demanda:', req.params.id);
    const user = req.user;
    console.log('🔍 GET /demandas/:id - Usuário:', user.id, 'Empresa:', user.empresaId);
    
    const demanda = await prisma.demanda.findFirst({
      where: { 
        id: req.params.id,
        OR: [
          { setor: { empresaId: user.empresaId } },
          { setorId: null, criadoPorId: user.id }
        ]
      },
      include: { 
        setor: true, 
        responsaveis: true, 
        observacoes: { include: { autor: true } },
        arquivos: {
          include: {
            uploadPor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { criadoEm: 'desc' }
        }
      }
    });
    
    console.log('🔍 GET /demandas/:id - Demanda encontrada:', demanda ? 'SIM' : 'NÃO');
    if (demanda) {
      console.log('🔍 GET /demandas/:id - Setor:', demanda.setorId, 'Criado por:', demanda.criadoPorId);
    }
    
    if (!demanda) {
      console.log('❌ GET /demandas/:id - Demanda não encontrada');
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }
    
    console.log('✅ GET /demandas/:id - Retornando demanda');
    res.json(demanda);
  } catch (error) {
    console.error('❌ GET /demandas/:id - Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar observação
router.post('/demandas/:id/observacoes', authenticateToken, async (req, res) => {
  const user = req.user;
  const { texto } = req.body;
  const demanda = await prisma.demanda.findFirst({ 
    where: { 
      id: req.params.id,
      OR: [
        { setor: { empresaId: user.empresaId } },
        { setorId: null, criadoPorId: user.id }
      ]
    }, 
    include: { responsaveis: true, setor: true } 
  });
  if (!demanda) return res.status(404).json({ error: 'Demanda não encontrada' });
  if (!demanda.responsaveis.some(u => u.id === user.id)) return res.status(403).json({ error: 'Apenas responsáveis podem comentar' });
  const observacao = await prisma.observacao.create({
    data: { texto, autorId: user.id, demandaId: req.params.id }
  });
  res.json(observacao);
});

// Upload de arquivo para demanda
router.post('/demandas/:id/arquivos', authenticateToken, uploadDemandaArquivo, handleDemandaUploadError, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Verificar se a demanda existe e pertence à empresa do usuário
    // Permitir demandas sem setor (criadas inicialmente sem setor)
    const demanda = await prisma.demanda.findFirst({
      where: { 
        id: id,
        OR: [
          { setor: { empresaId: user.empresaId } },
          { setorId: null, criadoPorId: user.id }
        ]
      }
    });

    if (!demanda) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    // Logs detalhados para debug
    console.log('🔍 req.file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer(${req.file.buffer.length} bytes)` : 'undefined'
    });

    // Usar o número da solicitação como nome da pasta
    const pastaDemanda = demanda.solicitacao;
    
    // Sanitizar o nome do arquivo para remover caracteres inválidos
    const nomeOriginalSanitizado = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const nomeArquivo = `${Date.now()}_${nomeOriginalSanitizado}`;
    
    console.log('🔍 Salvando arquivo no servidor SMB:', {
      pasta: pastaDemanda,
      arquivo: nomeArquivo,
      tamanho: req.file.size
    });

    // Sanitizar o nome da pasta para remover caracteres inválidos
    const pastaDemandaLimpa = pastaDemanda.toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Usar barras invertidas (\) para caminhos SMB
    const caminhoArquivoComPasta = `${pastaDemandaLimpa}\\${nomeArquivo}`;
    
    console.log('🔍 Tentando salvar arquivo:', caminhoArquivoComPasta);
    
    const smbClient = conectarServidorArquivos();
    
    // Primeiro verificar se a pasta da demanda existe
    smbClient.readdir(pastaDemandaLimpa, (readErr) => {
      if (readErr) {
        // Pasta não existe, criar
        console.log('🔍 Pasta não existe, criando...');
        smbClient.mkdir(pastaDemandaLimpa, (mkdirErr) => {
          if (mkdirErr && mkdirErr.code !== 'EEXIST' && mkdirErr.code !== 'STATUS_OBJECT_NAME_COLLISION') {
            console.error('❌ Erro ao criar pasta da demanda:', mkdirErr);
            
            // Se não conseguir criar pasta, tentar salvar na raiz como fallback
            console.log('🔍 Tentando salvar na raiz como fallback...');
            smbClient.writeFile(nomeArquivo, req.file.buffer, async (err) => {
              if (err) {
                console.error('❌ Erro ao salvar arquivo na raiz:', err);
                
                // Fallback final: salvar localmente
                console.log('🔍 Salvando arquivo localmente como fallback final...');
                const fs = require('fs');
                const path = require('path');
                const pastaLocal = path.join(__dirname, '..', '..', 'uploads', pastaDemandaLimpa);
                if (!fs.existsSync(pastaLocal)) {
                  fs.mkdirSync(pastaLocal, { recursive: true });
                }
                const caminhoLocal = path.join(pastaLocal, nomeArquivo);
                fs.writeFileSync(caminhoLocal, req.file.buffer);
                console.log('✅ Arquivo salvo localmente:', caminhoLocal);
                
                // Criar registro do arquivo no banco
                const arquivo = await prisma.arquivoDemanda.create({
                  data: {
                    nomeOriginal: req.file.originalname,
                    nomeArquivo: nomeArquivo,
                    caminho: `local:${caminhoLocal}`,
                    tamanho: req.file.size,
                    tipoMime: req.file.mimetype,
                    demandaId: id,
                    uploadPorId: user.id
                  },
                  include: {
                    uploadPor: {
                      select: {
                        id: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                });
                
                smbClient.close();
                res.status(201).json({
                  message: 'Arquivo enviado com sucesso (salvo localmente)',
                  data: arquivo
                });
                return;
              }
              
              console.log('✅ Arquivo salvo com sucesso na raiz:', nomeArquivo);
              
              // Criar registro do arquivo no banco
              const arquivo = await prisma.arquivoDemanda.create({
                data: {
                  nomeOriginal: req.file.originalname,
                  nomeArquivo: nomeArquivo,
                  caminho: nomeArquivo,
                  tamanho: req.file.size,
                  tipoMime: req.file.mimetype,
                  demandaId: id,
                  uploadPorId: user.id
                },
                include: {
                  uploadPor: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              });
              
              smbClient.close();
              res.status(201).json({
                message: 'Arquivo enviado com sucesso (salvo na raiz)',
                data: arquivo
              });
            });
            return;
          }
          
          console.log('✅ Pasta da demanda criada:', pastaDemandaLimpa);
          salvarArquivo();
        });
      } else {
        // Pasta já existe, salvar arquivo diretamente
        console.log('✅ Pasta da demanda já existe:', pastaDemandaLimpa);
        salvarArquivo();
      }
    });
    
    function salvarArquivo() {
      // Agora salvar o arquivo na pasta da demanda usando barras invertidas
      smbClient.writeFile(caminhoArquivoComPasta, req.file.buffer, async (err) => {
        if (err) {
          console.error('❌ Erro ao salvar arquivo na pasta da demanda:', err);
          
          // Fallback: tentar salvar na raiz
          console.log('🔍 Tentando salvar na raiz como fallback...');
          smbClient.writeFile(nomeArquivo, req.file.buffer, async (fallbackErr) => {
            if (fallbackErr) {
              console.error('❌ Erro ao salvar arquivo na raiz:', fallbackErr);
              
              // Fallback final: salvar localmente
              console.log('🔍 Salvando arquivo localmente como fallback final...');
              const fs = require('fs');
              const path = require('path');
              const pastaLocal = path.join(__dirname, '..', '..', 'uploads', pastaDemandaLimpa);
              if (!fs.existsSync(pastaLocal)) {
                fs.mkdirSync(pastaLocal, { recursive: true });
              }
              const caminhoLocal = path.join(pastaLocal, nomeArquivo);
              fs.writeFileSync(caminhoLocal, req.file.buffer);
              console.log('✅ Arquivo salvo localmente:', caminhoLocal);
              
              // Criar registro do arquivo no banco
              const arquivo = await prisma.arquivoDemanda.create({
                data: {
                  nomeOriginal: req.file.originalname,
                  nomeArquivo: nomeArquivo,
                  caminho: `local:${caminhoLocal}`,
                  tamanho: req.file.size,
                  tipoMime: req.file.mimetype,
                  demandaId: id,
                  uploadPorId: user.id
                },
                include: {
                  uploadPor: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              });
              
              smbClient.close();
              res.status(201).json({
                message: 'Arquivo enviado com sucesso (salvo localmente)',
                data: arquivo
              });
              return;
            }
            
            console.log('✅ Arquivo salvo com sucesso na raiz:', nomeArquivo);
            
            // Criar registro do arquivo no banco
            const arquivo = await prisma.arquivoDemanda.create({
              data: {
                nomeOriginal: req.file.originalname,
                nomeArquivo: nomeArquivo,
                caminho: nomeArquivo,
                tamanho: req.file.size,
                tipoMime: req.file.mimetype,
                demandaId: id,
                uploadPorId: user.id
              },
              include: {
                uploadPor: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            });
            
            smbClient.close();
            res.status(201).json({
              message: 'Arquivo enviado com sucesso (salvo na raiz)',
              data: arquivo
            });
          });
          return;
        }
        
        console.log('✅ Arquivo salvo com sucesso na pasta da demanda:', caminhoArquivoComPasta);
        
        // Criar registro do arquivo no banco
        const arquivo = await prisma.arquivoDemanda.create({
          data: {
            nomeOriginal: req.file.originalname,
            nomeArquivo: nomeArquivo,
            caminho: caminhoArquivoComPasta,
            tamanho: req.file.size,
            tipoMime: req.file.mimetype,
            demandaId: id,
            uploadPorId: user.id
          },
          include: {
            uploadPor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });
        
        smbClient.close();
        res.status(201).json({
          message: 'Arquivo enviado com sucesso',
          data: arquivo
        });
      });
    }
  } catch (error) {
    console.error('❌ Erro ao fazer upload do arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar arquivos de uma demanda
router.get('/demandas/:id/arquivos', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Verificar se a demanda existe e pertence à empresa do usuário
    // Permitir demandas sem setor (criadas inicialmente sem setor)
    const demanda = await prisma.demanda.findFirst({
      where: { 
        id: id,
        OR: [
          { setor: { empresaId: user.empresaId } },
          { setorId: null, criadoPorId: user.id }
        ]
      }
    });

    if (!demanda) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }

    // Buscar arquivos da demanda
    const arquivos = await prisma.arquivoDemanda.findMany({
      where: { demandaId: id },
      include: {
        uploadPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

    res.json({ data: arquivos });
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Download de arquivo
router.get('/demandas/arquivos/:arquivoId/download', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { arquivoId } = req.params;

    // Buscar arquivo e verificar permissões
    const arquivo = await prisma.arquivoDemanda.findFirst({
      where: { 
        id: arquivoId,
        demanda: {
          OR: [
            { setor: { empresaId: user.empresaId } },
            { setorId: null, criadoPorId: user.id }
          ]
        }
      },
      include: {
        demanda: {
          include: {
            setor: true
          }
        }
      }
    });

    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    let filePath;
    
    // Verificar se é um arquivo local ou SMB
    if (arquivo.caminho.startsWith('local:')) {
      // Arquivo salvo localmente
      filePath = arquivo.caminho.replace('local:', '');
    } else {
      // Arquivo salvo no SMB - tentar buscar do SMB primeiro
      try {
        const smbClient = conectarServidorArquivos();
        
        // Tentar ler do SMB
        const buffer = await new Promise((resolve, reject) => {
          smbClient.readFile(arquivo.caminho, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
            smbClient.close();
          });
        });
        
        // Configurar headers para download
        res.setHeader('Content-Type', arquivo.tipoMime);
        res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nomeOriginal}"`);
        res.setHeader('Content-Length', arquivo.tamanho);
        
        // Enviar buffer do SMB
        res.send(buffer);
        return;
        
      } catch (smbError) {
        console.log('⚠️ Arquivo não encontrado no SMB, tentando local...');
        // Se não encontrar no SMB, tentar local
        filePath = path.join(__dirname, '..', '..', 'uploads', arquivo.nomeArquivo);
      }
    }
    
    // Verificar se o arquivo existe fisicamente
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
    }

    // Configurar headers para download
    res.setHeader('Content-Type', arquivo.tipoMime);
    res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nomeOriginal}"`);
    res.setHeader('Content-Length', arquivo.tamanho);

    // Enviar arquivo
    res.sendFile(filePath);
  } catch (error) {
    console.error('Erro ao fazer download do arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover arquivo
router.delete('/demandas/arquivos/:arquivoId', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { arquivoId } = req.params;

    // Buscar arquivo e verificar permissões
    const arquivo = await prisma.arquivoDemanda.findFirst({
      where: { 
        id: arquivoId,
        demanda: {
          OR: [
            { setor: { empresaId: user.empresaId } },
            { setorId: null, criadoPorId: user.id }
          ]
        }
      },
      include: {
        demanda: {
          include: {
            setor: true
          }
        }
      }
    });

    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Verificar se o usuário tem permissão (responsável ou criador da demanda)
    const temPermissao = arquivo.uploadPorId === user.id || 
                        arquivo.demanda.criadoPorId === user.id ||
                        arquivo.demanda.responsaveis.some(r => r.id === user.id);

    if (!temPermissao && user.nivel !== 'ADMIN' && user.nivel !== 'PROPRIETARIO') {
      return res.status(403).json({ error: 'Sem permissão para remover este arquivo' });
    }

    // Remover arquivo físico
    if (arquivo.caminho.startsWith('local:')) {
      // Arquivo salvo localmente
      const filePath = arquivo.caminho.replace('local:', '');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ Arquivo local removido:', filePath);
      }
    } else {
      // Arquivo salvo no SMB
      try {
        const smbClient = conectarServidorArquivos();
        smbClient.unlink(arquivo.caminho, (err) => {
          if (err) {
            console.log('⚠️ Não foi possível remover arquivo do SMB:', err.message);
          } else {
            console.log('✅ Arquivo SMB removido:', arquivo.caminho);
          }
          smbClient.close();
        });
      } catch (smbError) {
        console.log('⚠️ Erro ao conectar com SMB para remoção:', smbError.message);
      }
    }

    // Remover registro do banco
    await prisma.arquivoDemanda.delete({
      where: { id: arquivoId }
    });

    res.json({ message: 'Arquivo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Arquivar demanda
router.post('/demandas/:id/arquivar', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Verificar se a demanda existe e pertence à empresa do usuário
    const demanda = await prisma.demanda.findFirst({
      where: { 
        id: id,
        OR: [
          { setor: { empresaId: user.empresaId } },
          { setorId: null, criadoPorId: user.id }
        ]
      }
    });

    if (!demanda) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }

    // Verificar se o usuário tem permissão (responsável, criador ou admin)
    const temPermissao = demanda.criadoPorId === user.id || 
                        demanda.responsaveis.some(r => r.id === user.id) ||
                        user.nivel === 'ADMIN' || 
                        user.nivel === 'PROPRIETARIO';

    if (!temPermissao) {
      return res.status(403).json({ error: 'Sem permissão para arquivar esta demanda' });
    }

    // Arquivar a demanda
    const demandaArquivada = await prisma.demanda.update({
      where: { id: id },
      data: {
        arquivada: true,
        dataArquivamento: new Date()
      },
      include: { 
        setor: true, 
        responsaveis: true, 
        observacoes: true,
        arquivos: {
          include: {
            uploadPor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Demanda arquivada com sucesso',
      data: demandaArquivada
    });
  } catch (error) {
    console.error('Erro ao arquivar demanda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Desarquivar demanda
router.post('/demandas/:id/desarquivar', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Verificar se a demanda existe e pertence à empresa do usuário
    const demanda = await prisma.demanda.findFirst({
      where: { 
        id: id,
        OR: [
          { setor: { empresaId: user.empresaId } },
          { setorId: null, criadoPorId: user.id }
        ]
      }
    });

    if (!demanda) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }

    // Verificar se o usuário tem permissão (responsável, criador ou admin)
    const temPermissao = demanda.criadoPorId === user.id || 
                        demanda.responsaveis.some(r => r.id === user.id) ||
                        user.nivel === 'ADMIN' || 
                        user.nivel === 'PROPRIETARIO';

    if (!temPermissao) {
      return res.status(403).json({ error: 'Sem permissão para desarquivar esta demanda' });
    }

    // Desarquivar a demanda
    const demandaDesarquivada = await prisma.demanda.update({
      where: { id: id },
      data: {
        arquivada: false,
        dataArquivamento: null
      },
      include: { 
        setor: true, 
        responsaveis: true, 
        observacoes: true,
        arquivos: {
          include: {
            uploadPor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Demanda desarquivada com sucesso',
      data: demandaDesarquivada
    });
  } catch (error) {
    console.error('Erro ao desarquivar demanda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Testar conexão com servidor de arquivos
router.post('/demandas/testar-conexao-arquivos', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    console.log('🔍 Testando conexão com servidor de arquivos...');
    
    // Testar conexão real com o servidor
    await testarConexaoArquivos();
    
    res.json({ 
      success: true, 
      message: 'Conexão estabelecida com sucesso',
      config: {
        host: '10.10.5.6',
        share: 'App_eventos'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao testar conexão com servidor de arquivos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Falha na conexão com servidor de arquivos',
      details: error.message
    });
  }
});

// Obter caminho real do arquivo para visualização
router.get('/demandas/arquivos/:arquivoId/caminho', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { arquivoId } = req.params;

    // Buscar arquivo e verificar permissões
    const arquivo = await prisma.arquivoDemanda.findFirst({
      where: { 
        id: arquivoId,
        demanda: {
          OR: [
            { setor: { empresaId: user.empresaId } },
            { setorId: null, criadoPorId: user.id }
          ]
        }
      },
      include: {
        demanda: {
          include: {
            setor: true
          }
        }
      }
    });

    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    let caminhoReal;
    
    // Verificar se é um arquivo local ou SMB
    if (arquivo.caminho.startsWith('local:')) {
      // Arquivo salvo localmente
      caminhoReal = arquivo.caminho.replace('local:', '');
    } else {
      // Arquivo salvo no SMB - construir caminho UNC usando número da solicitação
      const pastaDemanda = arquivo.demanda.solicitacao;
      const pastaDemandaLimpa = pastaDemanda.toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      const nomeArquivo = arquivo.nomeArquivo;
      caminhoReal = `\\\\caafiles-v\\App_Eventos\\${pastaDemandaLimpa}\\${nomeArquivo}`;
    }

    res.json({ 
      caminhoReal,
      nomeOriginal: arquivo.nomeOriginal,
      tipoMime: arquivo.tipoMime
    });
  } catch (error) {
    console.error('Erro ao obter caminho do arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar pasta definitiva para nova demanda
router.post('/demandas/pasta-definitiva', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.nivel !== 'ADMIN' && user.nivel !== 'PROPRIETARIO' && !user.podeGerenciarDemandas) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Gerar número de solicitação definitivo
    const numeroSolicitacao = await proximoNumeroSolicitacao();
    const pastaDemanda = String(numeroSolicitacao);
    
    // Sanitizar o nome da pasta para remover caracteres inválidos
    const pastaDemandaLimpa = pastaDemanda.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    console.log('🔍 Criando pasta definitiva:', pastaDemandaLimpa);
    
    // Criar pasta no servidor SMB
    const smbClient = conectarServidorArquivos();
    
    smbClient.mkdir(pastaDemandaLimpa, (err) => {
      if (err && err.code !== 'EEXIST') {
        console.error('❌ Erro ao criar pasta definitiva:', err);
        smbClient.close();
        return res.status(500).json({ error: 'Erro ao criar pasta definitiva' });
      }
      
      console.log('✅ Pasta definitiva criada:', pastaDemandaLimpa);
      smbClient.close();
      
      res.json({ 
        success: true,
        pastaDefinitiva: pastaDemandaLimpa,
        numeroSolicitacao: pastaDemanda
      });
    });
  } catch (error) {
    console.error('❌ Erro ao criar pasta definitiva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de arquivo para pasta definitiva
router.post('/demandas/arquivo-definitivo', authenticateToken, uploadDemandaArquivo, handleDemandaUploadError, async (req, res) => {
  try {
    console.log('🔍 POST /demandas/arquivo-definitivo - Iniciando upload definitivo');
    const user = req.user;
    const { pastaDefinitiva, demandaId } = req.body;

    console.log('🔍 POST /demandas/arquivo-definitivo - pastaDefinitiva:', pastaDefinitiva);
    console.log('🔍 POST /demandas/arquivo-definitivo - req.body:', req.body);
    console.log('🔍 POST /demandas/arquivo-definitivo - req.file:', req.file);

    if (!req.file) {
      console.error('❌ Nenhum arquivo foi enviado');
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    if (!pastaDefinitiva) {
      console.error('❌ Pasta definitiva não especificada');
      return res.status(400).json({ error: 'Pasta definitiva não especificada' });
    }

    // Sanitizar o nome da pasta e do arquivo de forma mais rigorosa
    const pastaLimpa = pastaDefinitiva.toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    const nomeOriginalSanitizado = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const nomeArquivo = `${Date.now()}_${nomeOriginalSanitizado}`;
    
    console.log('🔍 Salvando arquivo definitivo:', {
      pasta: pastaLimpa,
      arquivo: nomeArquivo,
      tamanho: req.file.size,
      nomeOriginal: req.file.originalname
    });

    // Salvar arquivo na pasta definitiva
    const smbClient = conectarServidorArquivos();
    const caminhoArquivo = `${pastaLimpa}/${nomeArquivo}`;
    
    console.log('🔍 Tentando salvar arquivo no SMB:', caminhoArquivo);
    
    // Verificar se a pasta existe antes de tentar salvar
    smbClient.readdir(pastaLimpa, (readErr) => {
      if (readErr) {
        // Pasta não existe, criar
        console.log('🔍 Pasta não existe, criando...');
        smbClient.mkdir(pastaLimpa, (mkdirErr) => {
          if (mkdirErr && mkdirErr.code !== 'EEXIST' && mkdirErr.code !== 'STATUS_OBJECT_NAME_COLLISION') {
            console.error('❌ Erro ao criar pasta:', mkdirErr);
            
            // Se não conseguir criar pasta, tentar salvar na raiz como fallback
            console.log('🔍 Tentando salvar na raiz como fallback...');
            smbClient.writeFile(nomeArquivo, req.file.buffer, async (err) => {
              if (err) {
                console.error('❌ Erro ao salvar arquivo na raiz:', err);
                
                // Fallback final: salvar localmente
                console.log('🔍 Salvando arquivo localmente como fallback final...');
                const fs = require('fs');
                const path = require('path');
                const pastaLocal = path.join(__dirname, '..', '..', 'uploads', pastaLimpa);
                if (!fs.existsSync(pastaLocal)) {
                  fs.mkdirSync(pastaLocal, { recursive: true });
                }
                const caminhoLocal = path.join(pastaLocal, nomeArquivo);
                fs.writeFileSync(caminhoLocal, req.file.buffer);
                console.log('✅ Arquivo salvo localmente:', caminhoLocal);
                
                // Criar registro do arquivo no banco
                const arquivo = await prisma.arquivoDemanda.create({
                  data: {
                    nomeOriginal: req.file.originalname,
                    nomeArquivo: nomeArquivo,
                    caminho: `local:${caminhoLocal}`,
                    tamanho: req.file.size,
                    tipoMime: req.file.mimetype,
                    demandaId: id,
                    uploadPorId: user.id
                  },
                  include: {
                    uploadPor: {
                      select: {
                        id: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                });
                
                smbClient.close();
                res.status(201).json({
                  message: 'Arquivo enviado com sucesso (salvo localmente)',
                  data: arquivo
                });
                return;
              }
              
              console.log('✅ Arquivo salvo com sucesso na raiz:', nomeArquivo);
              
              // Criar registro do arquivo no banco
              const arquivo = await prisma.arquivoDemanda.create({
                data: {
                  nomeOriginal: req.file.originalname,
                  nomeArquivo: nomeArquivo,
                  caminho: nomeArquivo,
                  tamanho: req.file.size,
                  tipoMime: req.file.mimetype,
                  demandaId: id,
                  uploadPorId: user.id
                },
                include: {
                  uploadPor: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              });
              
              smbClient.close();
              res.status(201).json({
                message: 'Arquivo enviado com sucesso (salvo na raiz)',
                data: arquivo
              });
            });
            return;
          }
          
          console.log('✅ Pasta da demanda criada:', pastaLimpa);
          salvarArquivo();
        });
      } else {
        // Pasta já existe, salvar arquivo diretamente
        console.log('✅ Pasta da demanda já existe:', pastaLimpa);
        salvarArquivo();
      }
    });
    
    function salvarArquivo() {
      // Agora salvar o arquivo na pasta da demanda usando barras invertidas
      smbClient.writeFile(caminhoArquivo, req.file.buffer, async (err) => {
        if (err) {
          console.error('❌ Erro ao salvar arquivo na pasta da demanda:', err);
          
          // Fallback: tentar salvar na raiz
          console.log('🔍 Tentando salvar na raiz como fallback...');
          smbClient.writeFile(nomeArquivo, req.file.buffer, async (fallbackErr) => {
            if (fallbackErr) {
              console.error('❌ Erro ao salvar arquivo na raiz:', fallbackErr);
              
              // Fallback final: salvar localmente
              console.log('🔍 Salvando arquivo localmente como fallback final...');
              const fs = require('fs');
              const path = require('path');
              const pastaLocal = path.join(__dirname, '..', '..', 'uploads', pastaLimpa);
              if (!fs.existsSync(pastaLocal)) {
                fs.mkdirSync(pastaLocal, { recursive: true });
              }
              const caminhoLocal = path.join(pastaLocal, nomeArquivo);
              fs.writeFileSync(caminhoLocal, req.file.buffer);
              console.log('✅ Arquivo salvo localmente:', caminhoLocal);
              
              // Criar registro do arquivo no banco
              const arquivo = await prisma.arquivoDemanda.create({
                data: {
                  nomeOriginal: req.file.originalname,
                  nomeArquivo: nomeArquivo,
                  caminho: `local:${caminhoLocal}`,
                  tamanho: req.file.size,
                  tipoMime: req.file.mimetype,
                  demandaId: id,
                  uploadPorId: user.id
                },
                include: {
                  uploadPor: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              });
              
              smbClient.close();
              res.status(201).json({
                message: 'Arquivo enviado com sucesso (salvo localmente)',
                data: arquivo
              });
              return;
            }
            
            console.log('✅ Arquivo salvo com sucesso na raiz:', nomeArquivo);
            
            // Criar registro do arquivo no banco
            const arquivo = await prisma.arquivoDemanda.create({
              data: {
                nomeOriginal: req.file.originalname,
                nomeArquivo: nomeArquivo,
                caminho: nomeArquivo,
                tamanho: req.file.size,
                tipoMime: req.file.mimetype,
                demandaId: id,
                uploadPorId: user.id
              },
              include: {
                uploadPor: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            });
            
            smbClient.close();
            res.status(201).json({
              message: 'Arquivo enviado com sucesso (salvo na raiz)',
              data: arquivo
            });
          });
          return;
        }
        
        console.log('✅ Arquivo salvo com sucesso na pasta da demanda:', caminhoArquivo);
        
        // Criar registro do arquivo no banco
        const arquivo = await prisma.arquivoDemanda.create({
          data: {
            nomeOriginal: req.file.originalname,
            nomeArquivo: nomeArquivo,
            caminho: caminhoArquivo,
            tamanho: req.file.size,
            tipoMime: req.file.mimetype,
            demandaId: id,
            uploadPorId: user.id
          },
          include: {
            uploadPor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });
        
        smbClient.close();
        res.status(201).json({
          message: 'Arquivo enviado com sucesso',
          data: arquivo
        });
      });
    }
  } catch (error) {
    console.error('❌ Erro ao fazer upload do arquivo definitivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Teste de salvamento de arquivo (sem autenticação para teste)
router.post('/demandas/teste-salvamento-simples', async (req, res) => {
  try {
    console.log('🔍 Teste de salvamento simples iniciado');
    
    // Criar um buffer de teste
    const bufferTeste = Buffer.from('Teste de arquivo simples');
    const nomeArquivo = 'teste_simples.txt';
    const pastaTeste = 'teste_pasta_simples';
    
    console.log('🔍 Salvando arquivo de teste simples:', {
      pasta: pastaTeste,
      arquivo: nomeArquivo,
      tamanho: bufferTeste.length
    });
    
    const smbClient = conectarServidorArquivos();
    const caminhoArquivo = `${pastaTeste}/${nomeArquivo}`;
    
    // Primeiro criar a pasta
    smbClient.mkdir(pastaTeste, (mkdirErr) => {
      if (mkdirErr && mkdirErr.code !== 'EEXIST') {
        console.error('❌ Erro ao criar pasta de teste simples:', mkdirErr);
        smbClient.close();
        return res.status(500).json({ error: 'Erro ao criar pasta de teste simples' });
      }
      
      console.log('✅ Pasta de teste simples criada/verificada');
      
      // Agora salvar o arquivo
      smbClient.writeFile(caminhoArquivo, bufferTeste, (err) => {
        if (err) {
          console.error('❌ Erro ao salvar arquivo de teste simples:', err);
          smbClient.close();
          return res.status(500).json({ error: 'Erro ao salvar arquivo de teste simples' });
        }
        
        console.log('✅ Arquivo de teste simples salvo com sucesso:', caminhoArquivo);
        smbClient.close();
        
        res.json({ 
          success: true, 
          message: 'Teste de salvamento simples realizado com sucesso',
          caminho: caminhoArquivo
        });
      });
    });
  } catch (error) {
    console.error('❌ Erro no teste de salvamento simples:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar demanda definitiva ao abrir modal
router.post('/demandas/definitiva', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 POST /demandas/definitiva - Criando demanda definitiva');
    
    const user = req.user;
    if (user.nivel !== 'ADMIN' && user.nivel !== 'PROPRIETARIO' && !user.podeGerenciarDemandas) {
      console.log('❌ POST /demandas/definitiva - Acesso negado para usuário:', user.id);
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { setorId } = req.body;
    
    // Gerar número de solicitação
    const numeroSolicitacao = await proximoNumeroSolicitacao();
    
    // Criar demanda definitiva no banco
    const demandaDefinitiva = await prisma.demanda.create({
      data: {
        solicitacao: String(numeroSolicitacao),
        nomeProjeto: 'Nova Demanda',
        descricao: 'Demanda em criação',
        solicitante: user.name || 'Usuário',
        prioridade: 'MEDIA',
        status: 'ABERTO',
        dataAbertura: new Date(),
        dataEntrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        setorId: setorId || null,
        criadoPorId: user.id
      },
      include: { 
        setor: true, 
        responsaveis: true, 
        observacoes: true,
        criadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Demanda definitiva criada:', demandaDefinitiva.id);
    
    // Após criar a demanda definitiva no banco
    const pastaDemandaLimpa = demandaDefinitiva.solicitacao.replace(/[^a-zA-Z0-9_-]/g, '_');
    const smbClient = conectarServidorArquivos();
    smbClient.mkdir(pastaDemandaLimpa, (err) => {
      if (err && err.code !== 'EEXIST') {
        console.error('❌ Erro ao criar pasta definitiva no SMB:', err);
        // Não retorna erro para o frontend, só loga
      } else {
        console.log('✅ Pasta definitiva criada no SMB:', pastaDemandaLimpa);
      }
      smbClient.close();
    });
    
    res.json({
      success: true,
      demandaDefinitiva: demandaDefinitiva,
      numeroSolicitacao: String(numeroSolicitacao)
    });
  } catch (error) {
    console.error('❌ Erro ao criar demanda definitiva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar demanda definitiva
router.put('/demandas/definitiva/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 PUT /demandas/definitiva/:id - Atualizando demanda definitiva');
    
    const user = req.user;
    const { id } = req.params;
    const { nomeProjeto, descricao, solicitante, prioridade, status, dataEntrega, setorId, responsaveisIds, numeroFluig, linkPastaProjeto, linkSite, observacoesIniciais } = req.body;
    
    if (user.nivel !== 'ADMIN' && user.nivel !== 'PROPRIETARIO' && !user.podeGerenciarDemandas) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Validação dos responsáveis
    let setResponsaveis = [];
    if (responsaveisIds && responsaveisIds.length) {
      const idsArray = Array.isArray(responsaveisIds) ? responsaveisIds : [responsaveisIds];
      const count = await prisma.user.count({ where: { id: { in: idsArray } } });
      if (count !== idsArray.length) {
        return res.status(400).json({ error: 'Um ou mais responsáveis não existem.' });
      }
      setResponsaveis = idsArray.map(id => ({ id }));
    }

    // Processar observações se fornecidas
    let observacoesData = undefined;
    if (observacoesIniciais && observacoesIniciais.length > 0) {
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

    // Preparar dados para atualização, filtrando campos undefined/null
    const dadosAtualizacao = {
      nomeProjeto: nomeProjeto || 'Nova Demanda',
      descricao: descricao || null,
      solicitante: solicitante || user.name || 'Usuário',
      prioridade: prioridade || 'MEDIA',
      status: status || 'ABERTO',
      setorId: setorId || null,
      responsaveis: { set: setResponsaveis },
      numeroFluig: numeroFluig || null,
      linkPastaProjeto: linkPastaProjeto || null,
      linkSite: linkSite || null,
      ...(observacoesData && { observacoes: observacoesData })
    };

    // Adicionar dataEntrega apenas se for fornecido
    if (dataEntrega) {
      dadosAtualizacao.dataEntrega = new Date(dataEntrega);
    }

    // Atualizar demanda definitiva
    const demanda = await prisma.demanda.update({
      where: { id: id },
      data: dadosAtualizacao,
      include: { 
        setor: true, 
        responsaveis: true, 
        observacoes: true,
        arquivos: {
          include: {
            uploadPor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log('✅ Demanda definitiva atualizada:', demanda.id);
    res.json(demanda);
  } catch (error) {
    console.error('❌ Erro ao atualizar demanda definitiva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar demanda definitiva (cancelamento)
router.delete('/demandas/definitiva/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 DELETE /demandas/definitiva/:id - Deletando demanda definitiva');
    
    const user = req.user;
    const { id } = req.params;
    
    if (user.nivel !== 'ADMIN' && user.nivel !== 'PROPRIETARIO' && !user.podeGerenciarDemandas) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar se a demanda existe
    const demanda = await prisma.demanda.findUnique({
      where: { id: id },
      include: { arquivos: true }
    });

    if (!demanda) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }

    // Deletar arquivos físicos
    for (const arquivo of demanda.arquivos) {
      if (arquivo.caminho.startsWith('local:')) {
        const fs = require('fs');
        const filePath = arquivo.caminho.replace('local:', '');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Arquivo local deletado:', filePath);
        }
      } else {
        // Tentar deletar do SMB
        try {
          const smbClient = conectarServidorArquivos();
          smbClient.unlink(arquivo.caminho, (err) => {
            if (err) {
              console.log('⚠️ Não foi possível deletar arquivo do SMB:', err.message);
            } else {
              console.log('✅ Arquivo SMB deletado:', arquivo.caminho);
            }
            smbClient.close();
          });
        } catch (smbError) {
          console.log('⚠️ Erro ao conectar com SMB para deleção:', smbError.message);
        }
      }
    }

    // Deletar demanda e arquivos do banco
    await prisma.demanda.delete({
      where: { id: id }
    });

    console.log('✅ Demanda definitiva deletada:', id);
    res.json({ success: true, message: 'Demanda deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar demanda definitiva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Preview de arquivo
router.get('/demandas/arquivos/:arquivoId/preview', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /demandas/arquivos/:arquivoId/preview - Iniciando preview');
    const user = req.user;
    const { arquivoId } = req.params;

    console.log('🔍 GET /demandas/arquivos/:arquivoId/preview - arquivoId:', arquivoId);

    // Buscar arquivo e verificar permissões
    const arquivo = await prisma.arquivoDemanda.findFirst({
      where: { 
        id: arquivoId,
        demanda: {
          OR: [
            { setor: { empresaId: user.empresaId } },
            { setorId: null, criadoPorId: user.id }
          ]
        }
      },
      include: {
        demanda: {
          include: {
            setor: true
          }
        }
      }
    });

    if (!arquivo) {
      console.log('❌ GET /demandas/arquivos/:arquivoId/preview - Arquivo não encontrado');
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    console.log('🔍 GET /demandas/arquivos/:arquivoId/preview - Arquivo encontrado:', {
      nomeOriginal: arquivo.nomeOriginal,
      nomeArquivo: arquivo.nomeArquivo,
      caminho: arquivo.caminho,
      tipoMime: arquivo.tipoMime,
      tamanho: arquivo.tamanho
    });

    let filePath;
    let isLocal = false;
    
    // Verificar se é um arquivo local ou SMB
    if (arquivo.caminho.startsWith('local:')) {
      // Arquivo salvo localmente
      filePath = arquivo.caminho.replace('local:', '');
      isLocal = true;
      console.log('🔍 GET /demandas/arquivos/:arquivoId/preview - Arquivo local:', filePath);
    } else {
      // Arquivo salvo no SMB - usar o caminho armazenado no banco
      filePath = arquivo.caminho;
      console.log('🔍 GET /demandas/arquivos/:arquivoId/preview - Arquivo SMB:', filePath);
    }

    // Configurar headers para preview
    res.setHeader('Content-Type', arquivo.tipoMime);
    res.setHeader('Content-Length', arquivo.tamanho);
    res.setHeader('Content-Disposition', `inline; filename="${arquivo.nomeOriginal}"`);
    
    // Permitir CORS para preview
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (isLocal) {
      // Arquivo local - servir diretamente
      if (!fs.existsSync(filePath)) {
        console.log('❌ GET /demandas/arquivos/:arquivoId/preview - Arquivo local não encontrado:', filePath);
        return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
      }
      
      console.log('✅ GET /demandas/arquivos/:arquivoId/preview - Servindo arquivo local');
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } else {
      // Arquivo SMB - usar readFile com timeout
      console.log('🔍 GET /demandas/arquivos/:arquivoId/preview - Tentando ler do SMB:', filePath);
      const smbClient = conectarServidorArquivos();
      
      // Adicionar timeout para evitar travamento
      const timeout = setTimeout(() => {
        console.error('❌ GET /demandas/arquivos/:arquivoId/preview - Timeout ao ler arquivo SMB');
        res.status(408).json({ error: 'Timeout ao ler arquivo do servidor SMB' });
        smbClient.close();
      }, 10000); // 10 segundos
      
      // Usar readFile em vez de createReadStream para melhor compatibilidade
      smbClient.readFile(filePath, (err, data) => {
        clearTimeout(timeout);
        
        if (err) {
          console.error('❌ GET /demandas/arquivos/:arquivoId/preview - Erro ao ler arquivo SMB:', err);
          
          // Fallback: tentar redirecionar para download
          console.log('🔍 GET /demandas/arquivos/:arquivoId/preview - Redirecionando para download como fallback');
          res.redirect(`/api/demandas/arquivos/${arquivoId}/download`);
          smbClient.close();
          return;
        }
        
        console.log('✅ GET /demandas/arquivos/:arquivoId/preview - Arquivo SMB lido com sucesso, tamanho:', data.length);
        
        // Enviar o buffer diretamente
        res.send(data);
        smbClient.close();
      });
    }
  } catch (error) {
    console.error('❌ GET /demandas/arquivos/:arquivoId/preview - Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Debug: Verificar dados do arquivo
router.get('/demandas/arquivos/:arquivoId/debug', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /demandas/arquivos/:arquivoId/debug - Debug do arquivo');
    const user = req.user;
    const { arquivoId } = req.params;

    // Buscar arquivo
    const arquivo = await prisma.arquivoDemanda.findFirst({
      where: { 
        id: arquivoId,
        demanda: {
          OR: [
            { setor: { empresaId: user.empresaId } },
            { setorId: null, criadoPorId: user.id }
          ]
        }
      },
      include: {
        demanda: {
          include: {
            setor: true
          }
        },
        uploadPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Testar conectividade SMB
    let smbTest = null;
    try {
      const smbClient = conectarServidorArquivos();
      
      // Testar se consegue listar arquivos na raiz
      smbClient.readdir('', (err, files) => {
        if (err) {
          smbTest = { error: err.message };
        } else {
          smbTest = { success: true, files: files.slice(0, 10) }; // Primeiros 10 arquivos
        }
        smbClient.close();
      });
    } catch (error) {
      smbTest = { error: error.message };
    }

    // Se for arquivo SMB, testar se o arquivo existe
    let arquivoExiste = null;
    if (!arquivo.caminho.startsWith('local:')) {
      try {
        const smbClient = conectarServidorArquivos();
        smbClient.readFile(arquivo.caminho, (err, data) => {
          if (err) {
            arquivoExiste = { error: err.message };
          } else {
            arquivoExiste = { success: true, size: data.length };
          }
          smbClient.close();
        });
      } catch (error) {
        arquivoExiste = { error: error.message };
      }
    }

    res.json({
      arquivo: {
        id: arquivo.id,
        nomeOriginal: arquivo.nomeOriginal,
        nomeArquivo: arquivo.nomeArquivo,
        caminho: arquivo.caminho,
        tipoMime: arquivo.tipoMime,
        tamanho: arquivo.tamanho,
        criadoEm: arquivo.criadoEm,
        uploadPor: arquivo.uploadPor,
        demanda: {
          id: arquivo.demanda.id,
          solicitacao: arquivo.demanda.solicitacao,
          nomeProjeto: arquivo.demanda.nomeProjeto
        }
      },
      smbTest,
      arquivoExiste
    });
  } catch (error) {
    console.error('❌ Erro no debug do arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 