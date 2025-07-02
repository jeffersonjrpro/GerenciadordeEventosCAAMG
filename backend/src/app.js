const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/events'));
app.use('/api', require('./routes/guests'));
app.use('/api', require('./routes/checkin'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/demandas'));
app.use('/api', require('./routes/agendamentos'));
app.use('/api', require('./routes/notifications'));

// Rotas do admin
app.use('/api/admin', require('./routes/admin/auth'));
app.use('/api/admin', require('./routes/admin/empresas'));
app.use('/api/admin', require('./routes/admin/planos'));
app.use('/api/admin', require('./routes/admin/faturas'));
app.use('/api/admin', require('./routes/admin/admins'));
app.use('/api/admin', require('./routes/admin/logs'));
app.use('/api/admin', require('./routes/admin/eventos'));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

module.exports = app; 