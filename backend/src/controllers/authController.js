const { body, validationResult } = require('express-validator');
const AuthService = require('../services/authService');

class AuthController {
  // Validações para registro
  static registerValidation = [
    body('name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Nome deve ter pelo menos 2 caracteres'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter pelo menos 6 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
    body('telefone')
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage('Telefone deve ter pelo menos 10 dígitos'),
    body('codigoEmpresa')
      .optional()
      .trim(),
    body('nomeEmpresa')
      .if((value, { req }) => !req.body.codigoEmpresa)
      .notEmpty()
      .withMessage('Nome da empresa é obrigatório se não informar o código')
      .isLength({ min: 2 })
      .withMessage('Nome da empresa deve ter pelo menos 2 caracteres')
  ];

  // Validações para login
  static loginValidation = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('password')
      .notEmpty()
      .withMessage('Senha é obrigatória')
  ];

  // Validações para atualização de perfil
  static updateProfileValidation = [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Nome deve ter pelo menos 1 caractere'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('telefone')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Telefone deve ter pelo menos 1 dígito'),
    body('nomeEmpresa')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Nome da empresa deve ter pelo menos 1 caractere')
  ];

  static updatePasswordValidation = [
    body('currentPassword')
      .notEmpty()
      .withMessage('Senha atual é obrigatória para alterar senha'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Nova senha deve ter pelo menos 6 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número')
  ];

  // Registrar novo usuário
  static async register(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { name, email, password, telefone, nomeEmpresa, codigoEmpresa } = req.body;

      const result = await AuthService.register({
        name,
        email,
        password,
        telefone,
        nomeEmpresa,
        codigoEmpresa
      });

      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error.message === 'Email já cadastrado') {
        return res.status(409).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Login de usuário
  static async login(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      const result = await AuthService.login({
        email,
        password
      });

      res.json({
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro no login:', error);
      
      if (error.message === 'Email ou senha inválidos') {
        return res.status(401).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Obter perfil do usuário atual
  static async getProfile(req, res) {
    try {
      const user = await AuthService.getUserById(req.user.id);

      res.json({
        data: user
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar perfil do usuário
  static async updateProfile(req, res) {
    try {
      console.log('=== DEBUG UPDATE PROFILE ===');
      console.log('User ID:', req.user.id);
      console.log('Request body:', req.body);
      
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const updateData = req.body;
      console.log('Update data:', updateData);
      
      const updatedUser = await AuthService.updateProfile(req.user.id, updateData);
      console.log('Updated user:', updatedUser);

      res.json({
        message: 'Perfil atualizado com sucesso',
        data: updatedUser
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      if (error.message.includes('Email já está em uso')) {
        return res.status(400).json({
          error: error.message
        });
      }
      // Adicionar tratamento para código de empresa inválido
      if (error.message.includes('Código de empresa inválido')) {
        return res.status(400).json({
          error: error.message
        });
      }
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Alterar senha do usuário
  static async updatePassword(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      await AuthService.updatePassword(req.user.id, { currentPassword, newPassword });

      res.json({
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      if (error.message.includes('Senha atual incorreta') ||
          error.message.includes('Senha atual é necessária')) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Listar todos os usuários (apenas admin)
  static async getAllUsers(req, res) {
    try {
      const users = await AuthService.getAllUsers();

      res.json({
        data: users
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Deletar usuário (apenas admin)
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const result = await AuthService.deleteUser(userId);

      res.json({
        message: result.message
      });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Verificar token (rota de teste)
  static async verifyToken(req, res) {
    try {
      console.log('=== DEBUG VERIFY TOKEN ===');
      console.log('User ID from token:', req.user.id);
      
      const user = await AuthService.getUserById(req.user.id);
      console.log('User found:', user ? 'Yes' : 'No');
      
      res.json({
        message: 'Token válido',
        data: { user }
      });
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = AuthController; 