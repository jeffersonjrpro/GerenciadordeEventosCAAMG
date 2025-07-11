import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building } from 'lucide-react';
import logo from '../assets/logo-preta.png';
import axios from 'axios';

const Register = () => {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nomeEmpresaBloqueado, setNomeEmpresaBloqueado] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [codigoEmpresaError, setCodigoEmpresaError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  // Atualiza nomeEmpresa do formulário ao digitar
  const handleNomeEmpresaChange = (e) => {
    setNomeEmpresa(e.target.value);
  };

  // Busca nome da empresa ao digitar o código
  const handleCodigoEmpresaChange = async (e) => {
    const value = e.target.value;
    setCodigoEmpresaError('');
    if (!value) {
      setNomeEmpresa('');
      setNomeEmpresaBloqueado(false);
      return;
    }
    try {
      const res = await axios.get(`/api/empresa-codigo/${value}`);
      if (res.data && res.data.nome) {
        setNomeEmpresa(res.data.nome);
        setNomeEmpresaBloqueado(true);
      } else {
        setNomeEmpresa('');
        setNomeEmpresaBloqueado(false);
        setCodigoEmpresaError('Código de empresa inválido ou não encontrado');
      }
    } catch {
      setNomeEmpresa('');
      setNomeEmpresaBloqueado(false);
      setCodigoEmpresaError('Código de empresa inválido ou não encontrado');
    }
  };

  // Se o usuário digitar manualmente no campo de código, desbloqueia o nome se apagar
  useEffect(() => {
    if (!watch('codigoEmpresa')) {
      setNomeEmpresaBloqueado(false);
    }
  }, [watch('codigoEmpresa')]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Incluir o campo codigoEmpresa no data enviado
      const formData = {
        ...data,
        codigoEmpresa: data.codigoEmpresa || undefined,
        nivel: 'ADMIN'
      };
      const result = await registerUser(formData);
      if (result && result.error && result.error.includes('Email já cadastrado')) {
        setError('email', { type: 'manual', message: 'Email já cadastrado' });
      }
    } catch (error) {
      console.error('Erro no registro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo do App" className="h-16 w-auto" />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              faça login se já tem uma conta
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">
                Nome completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="input pl-10"
                  placeholder="Seu nome completo"
                  {...register('name', {
                    required: 'Nome é obrigatório',
                    minLength: {
                      value: 2,
                      message: 'Nome deve ter pelo menos 2 caracteres',
                    },
                  })}
                />
              </div>
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input pl-10"
                  placeholder="seu@email.com"
                  {...register('email', {
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="telefone" className="form-label">
                Telefone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="telefone"
                  type="tel"
                  autoComplete="tel"
                  className="input pl-10"
                  placeholder="(11) 99999-9999"
                  {...register('telefone', {
                    minLength: {
                      value: 10,
                      message: 'Telefone deve ter pelo menos 10 dígitos',
                    },
                  })}
                />
              </div>
              {errors.telefone && (
                <p className="form-error">{errors.telefone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="nomeEmpresa" className="form-label">
                Nome da Empresa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="nomeEmpresa"
                  type="text"
                  autoComplete="organization"
                  className="input pl-10"
                  placeholder="Nome da sua empresa"
                  {...register('nomeEmpresa', {
                    minLength: {
                      value: 2,
                      message: 'Nome da empresa deve ter pelo menos 2 caracteres',
                    },
                    onChange: (e) => {
                      if (!nomeEmpresaBloqueado) setNomeEmpresa(e.target.value);
                    }
                  })}
                  value={nomeEmpresaBloqueado ? nomeEmpresa : undefined}
                  disabled={nomeEmpresaBloqueado}
                />
              </div>
              {errors.nomeEmpresa && (
                <p className="form-error">{errors.nomeEmpresa.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="codigoEmpresa" className="form-label">
                Código da Empresa (opcional)
              </label>
              <input
                id="codigoEmpresa"
                type="text"
                className="input"
                placeholder="Informe o código se já existe uma empresa"
                {...register('codigoEmpresa')}
                onBlur={handleCodigoEmpresaChange}
              />
              {codigoEmpresaError && <p className="form-error">{codigoEmpresaError}</p>}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pl-10 pr-10"
                  placeholder="Sua senha"
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pl-10 pr-10"
                  placeholder="Confirme sua senha"
                  {...register('confirmPassword', {
                    required: 'Confirmação de senha é obrigatória',
                    validate: (value) =>
                      value === password || 'As senhas não coincidem',
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Ao criar uma conta, você concorda com nossos{' '}
              <button
                type="button"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Termos de Serviço
              </button>{' '}
              e{' '}
              <button
                type="button"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Política de Privacidade
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 