const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/events';
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  // Permitir apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
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
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Arquivo muito grande. Tamanho máximo: 5MB'
      });
    }
    return res.status(400).json({
      error: 'Erro no upload do arquivo'
    });
  }
  
  if (error.message === 'Apenas arquivos de imagem são permitidos!') {
    return res.status(400).json({
      error: error.message
    });
  }
  
  next(error);
};

module.exports = {
  uploadEventImage,
  handleUploadError
}; 