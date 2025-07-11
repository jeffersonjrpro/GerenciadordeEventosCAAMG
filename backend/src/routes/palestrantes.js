const express = require('express');
const router = express.Router({ mergeParams: true });
const palestranteController = require('../controllers/palestranteController');
const { uploadEventImage, handleUploadError } = require('../middleware/upload');

// Listar palestrantes do evento
router.get('/', palestranteController.list);

// Adicionar palestrante (com upload de imagem)
router.post('/', uploadEventImage, handleUploadError, palestranteController.create);

// Editar palestrante (com upload de imagem)
router.put('/:palestranteId', uploadEventImage, handleUploadError, palestranteController.update);

// Remover palestrante
router.delete('/:palestranteId', palestranteController.remove);

module.exports = router; 