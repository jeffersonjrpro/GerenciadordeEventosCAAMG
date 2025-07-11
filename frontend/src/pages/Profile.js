import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  User,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Phone,
  Building
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [showChangePassword, setShowChangePassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      telefone: user?.telefone || '',
      nomeEmpresa: user?.nomeEmpresa || '',
      codigoEmpresa: user?.codigoEmpresa || ''
    }
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        telefone: user.telefone || '',
        nomeEmpresa: user.nomeEmpresa || '',
        codigoEmpresa: user.codigoEmpresa || ''
      });
    }
  }, [user, reset]);

  const onSubmitProfile = async (data) => {
    setLoading(true);
    setMessage(null);

    try {
      const { name, email, telefone, nomeEmpresa, codigoEmpresa } = data;
      const result = await updateProfile({ name, email, telefone, nomeEmpresa, codigoEmpresa });
      if (result.success) {
        setMessage('Perfil atualizado com sucesso!');
        setMessageType('success');
      } else {
        setMessage(result.error || 'Erro ao atualizar perfil');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage(error.response?.data?.message || 'Erro ao atualizar perfil');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data) => {
    setLoading(true);
    setMessage(null);

    try {
      await api.put('/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      setMessage('Senha alterada com sucesso!');
      setMessageType('success');
      reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setMessage(error.response?.data?.message || 'Erro ao alterar senha');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie suas informações pessoais e configurações da conta
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          messageType === 'success' 
            ? 'bg-success-50 border border-success-200' 
            : 'bg-danger-50 border border-danger-200'
        }`}>
          <div className="flex">
            {messageType === 'success' ? (
              <CheckCircle className="h-5 w-5 text-success-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-danger-400" />
            )}
            <div className="ml-3">
              <p className={`text-sm ${
                messageType === 'success' ? 'text-success-700' : 'text-danger-700'
              }`}>
                {message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
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
                      className="input pl-10"
                      placeholder="(11) 99999-9999"
                      {...register('telefone', {
                        minLength: {
                          value: 1,
                          message: 'Telefone deve ter pelo menos 1 dígito',
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
                      className="input pl-10"
                      placeholder="Nome da sua empresa"
                      {...register('nomeEmpresa', {
                        minLength: {
                          value: 1,
                          message: 'Nome da empresa deve ter pelo menos 1 caractere',
                        },
                      })}
                      disabled={user?.empresaId || user?.codigoEmpresa}
                    />
                  </div>
                  {errors.nomeEmpresa && (
                    <p className="form-error">{errors.nomeEmpresa.message}</p>
                  )}
                </div>

                {/* Campo Código da Empresa */}
                {!user?.empresaId && (
                  <div>
                    <label htmlFor="codigoEmpresa" className="form-label">
                      Código da Empresa
                    </label>
                    <div className="relative">
                      <input
                        id="codigoEmpresa"
                        type="text"
                        className="input"
                        placeholder="Informe o código para se vincular a uma empresa"
                        {...register('codigoEmpresa', {
                          minLength: {
                            value: 6,
                            message: 'O código deve ter pelo menos 6 caracteres',
                          },
                        })}
                      />
                    </div>
                    {errors.codigoEmpresa && (
                      <p className="form-error">{errors.codigoEmpresa.message}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary inline-flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Formulário de senha só aparece se showChangePassword for true */}
          {showChangePassword && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Alterar Senha</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="form-label">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        className="input pl-10 pr-10"
                        placeholder="Sua senha atual"
                        {...register('currentPassword', {
                          required: 'Senha atual é obrigatória',
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
                    {errors.currentPassword && (
                      <p className="form-error">{errors.currentPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="form-label">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        className="input pl-10 pr-10"
                        placeholder="Nova senha"
                        {...register('newPassword', {
                          required: 'Nova senha é obrigatória',
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
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="form-error">{errors.newPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="input pl-10 pr-10"
                        placeholder="Confirme a nova senha"
                        {...register('confirmPassword', {
                          required: 'Confirmação de senha é obrigatória',
                          validate: (value) =>
                            value === newPassword || 'As senhas não coincidem',
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
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setShowChangePassword(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary inline-flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="space-y-6">
          {/* Account Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Informações da Conta</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">ID da Conta</p>
                <p className="text-sm text-gray-900">{user?.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nome</p>
                <p className="text-sm text-gray-900">{user?.name || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{user?.email || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Telefone</p>
                <p className="text-sm text-gray-900">{user?.telefone || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nome da Empresa</p>
                <p className="text-sm text-gray-900">{user?.nomeEmpresa || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Código da Empresa</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded select-all">{user?.codigoEmpresa || 'Não informado'}</p>
                  {user?.codigoEmpresa && (
                    <button
                      type="button"
                      className="text-blue-600 hover:underline text-xs"
                      onClick={() => {navigator.clipboard.writeText(user.codigoEmpresa)}}
                    >
                      Copiar
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Compartilhe este código com funcionários para que eles se cadastrem na sua empresa.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Membro desde</p>
                <p className="text-sm text-gray-900">
                  {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Última atualização</p>
                <p className="text-sm text-gray-900">
                  {user?.updatedAt ? formatDate(user.updatedAt) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Ações da Conta</h3>
            </div>
            <div className="card-body space-y-3">
              <button
                className="btn-outline w-full text-left"
                onClick={() => setShowChangePassword((v) => !v)}
              >
                Alterar Senha
              </button>
              <button className="btn-outline w-full text-left">
                Exportar meus dados
              </button>
              <button className="btn-outline w-full text-left">
                Configurações de privacidade
              </button>
              <button className="btn-outline w-full text-left">
                Configurações de notificações
              </button>
              <button className="btn-danger w-full text-left">
                Excluir conta
              </button>
            </div>
          </div>

          {/* Security Tips */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Dicas de Segurança</h3>
            </div>
            <div className="card-body">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-success-500 mr-2">•</span>
                  Use uma senha forte com pelo menos 8 caracteres
                </li>
                <li className="flex items-start">
                  <span className="text-success-500 mr-2">•</span>
                  Nunca compartilhe suas credenciais de login
                </li>
                <li className="flex items-start">
                  <span className="text-success-500 mr-2">•</span>
                  Ative a autenticação de dois fatores se disponível
                </li>
                <li className="flex items-start">
                  <span className="text-success-500 mr-2">•</span>
                  Mantenha seu email atualizado para recuperação
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 