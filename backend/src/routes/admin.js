const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { authenticateToken } = require('../middleware/auth');

const dashboardController = require('../controllers/admin/dashboardController');
const empresaController = require('../controllers/admin/empresaController');
const planoController = require('../controllers/admin/planoController');
const faturaController = require('../controllers/admin/faturaController');
const adminController = require('../controllers/admin/adminController');
const logController = require('../controllers/admin/logController');
const eventoController = require('../controllers/admin/eventoController');
const usuarioController = require('../controllers/admin/usuarioController');

// Login (sem autenticação)
router.post('/login', adminController.login);

// Dashboard
router.get('/dashboard', adminAuth, dashboardController.overview);

// Empresas
router.get('/empresas', adminAuth, empresaController.list);
router.post('/empresas', adminAuth, empresaController.create);
router.put('/empresas/:id', adminAuth, empresaController.update);
router.delete('/empresas/:id', adminAuth, empresaController.delete);
router.patch('/empresas/:id/bloquear', adminAuth, empresaController.block);
router.get('/empresas/:id', adminAuth, empresaController.get);

// Planos
router.get('/planos', adminAuth, planoController.list);
router.post('/planos', adminAuth, planoController.create);
router.put('/planos/:id', adminAuth, planoController.update);
router.delete('/planos/:id', adminAuth, planoController.delete);

// Faturas
router.get('/faturas', adminAuth, faturaController.list);
router.post('/faturas', adminAuth, faturaController.create);
router.patch('/faturas/:id/pagar', adminAuth, faturaController.markPaid);

// Admins
router.get('/admins', adminAuth, adminController.list);
router.post('/admins', adminAuth, adminController.create);
router.put('/admins/:id', adminAuth, adminController.update);
router.patch('/admins/:id/bloquear', adminAuth, adminController.block);
router.get('/todos-admins', adminAuth, adminController.listAllAdmins);

// Logs
router.get('/logs', adminAuth, logController.list);

// Eventos (Admin Master - acesso total a todos os eventos)
router.get('/eventos', adminAuth, eventoController.listAllEvents);
router.get('/eventos/stats', adminAuth, eventoController.getEventStats);
router.get('/eventos/:eventId', adminAuth, eventoController.getEvent);
router.put('/eventos/:eventId', adminAuth, eventoController.updateEvent);
router.delete('/eventos/:eventId', adminAuth, eventoController.deleteEvent);

// Usuários (Admin Master - acesso total a todos os usuários)
router.get('/usuarios', adminAuth, usuarioController.list);
router.get('/usuarios/:userId', adminAuth, usuarioController.get);
router.patch('/usuarios/:userId/reset-password', adminAuth, usuarioController.resetPassword);
router.put('/usuarios/:userId', adminAuth, usuarioController.update);

module.exports = router; 