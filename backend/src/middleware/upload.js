const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/events';
    console.log('📁 Upload destination:', uploadDir);
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      console.log('📁 Criando diretório:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('📄 Nome do arquivo gerado:', filename);
    cb(null, filename);
  }
});

// Filtro para tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  console.log('🔍 Verificando arquivo:', file.originalname, 'MIME:', file.mimetype);
  
  // Permitir apenas imagens
  if (file.mimetype.startsWith('image/')) {
    console.log('✅ Arquivo de imagem aceito');
    cb(null, true);
  } else {
    console.log('❌ Arquivo rejeitado - não é imagem');
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware para upload de imagem de evento
const uploadEventImage = upload.single('image');

// Middleware para tratamento de erros de upload
const handleUploadError = (error, req, res, next) => {
  console.error('Erro no upload:', error);
  
  if (error instanceof multer.MulterError) {
    console.error('Erro Multer:', error.code);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Arquivo muito grande. Tamanho máximo: 5MB'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Campo de arquivo inesperado'
      });
    }
    
    return res.status(400).json({
      error: 'Erro no upload do arquivo',
      details: error.message
    });
  }
  
  if (error.message === 'Apenas arquivos de imagem são permitidos!') {
    return res.status(400).json({
      error: error.message
    });
  }
  
  console.error('Erro não tratado no upload:', error);
  next(error);
};

// Configuração para upload de arquivos de demandas
// Usar memoryStorage para que o buffer fique disponível em req.file.buffer
const demandaStorage = multer.memoryStorage();

// Filtro para arquivos de demandas (aceita qualquer tipo)
const demandaFileFilter = (req, file, cb) => {
  console.log('🔍 Verificando arquivo demanda:', file.originalname, 'MIME:', file.mimetype);
  console.log('✅ Arquivo aceito para demanda');
  cb(null, true);
};

// Configurar multer para demandas
const uploadDemanda = multer({
  storage: demandaStorage,
  fileFilter: demandaFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Middleware para upload de arquivos de demanda
const uploadDemandaArquivo = uploadDemanda.single('arquivo');

// Middleware para tratamento de erros de upload de demandas
const handleDemandaUploadError = (error, req, res, next) => {
  console.error('Erro no upload de demanda:', error);
  
  if (error instanceof multer.MulterError) {
    console.error('Erro Multer demanda:', error.code);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Arquivo muito grande. Tamanho máximo: 100MB'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Campo de arquivo inesperado'
      });
    }
    
    return res.status(400).json({
      error: 'Erro no upload do arquivo',
      details: error.message
    });
  }
  
  console.error('Erro não tratado no upload de demanda:', error);
  next(error);
};

module.exports = {
  uploadEventImage,
  handleUploadError,
  uploadDemandaArquivo,
  handleDemandaUploadError
}; 