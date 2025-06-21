const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rotas públicas
router.post('/register', AuthController.registerValidation, AuthController.register);
router.post('/login', AuthController.loginValidation, AuthController.login);

// Rotas protegidas
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfileValidation, AuthController.updateProfile);
router.get('/verify', authenticateToken, AuthController.verifyToken);

// Rotas apenas para admin
router.get('/users', authenticateToken, requireAdmin, AuthController.getAllUsers);
router.delete('/users/:userId', authenticateToken, requireAdmin, AuthController.deleteUser);

module.exports = router; 