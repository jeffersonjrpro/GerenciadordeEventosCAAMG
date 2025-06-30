import React, { useState, useEffect } from 'react';
import { getEmpresas, updateEmpresa, deleteEmpresa, blockEmpresa, createEmpresa, getPlanos } from '../../services/adminApi';
import ConfirmationModal from '../../components/ConfirmationModal';
import toast, { Toaster } from 'react-hot-toast';
import { 
  EyeIcon, 
  PencilIcon, 
  LockClosedIcon, 
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState(null);
  const [empresaToBlock, setEmpresaToBlock] = useState(null);
  const [empresaToView, setEmpresaToView] = useState(null);
  const [newEmpresa, setNewEmpresa] = useState({
    nome: '',
    emailContato: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    status: 'ATIVA',
    planoId: null
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    nome: '',
    status: '',
    planoId: ''
  });
  const [showFiltros, setShowFiltros] = useState(false);

  useEffect(() => {
    loadEmpresas();
    loadPlanos();
  }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err) {
      setError('Erro ao carregar empresas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanos = async () => {
    try {
      const data = await getPlanos();
      setPlanos(data);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
  };

  // Filtrar empresas
  const empresasFiltradas = empresas.filter(empresa => {
    const matchNome = empresa.nome.toLowerCase().includes(filtros.nome.toLowerCase());
    const matchStatus = !filtros.status || empresa.status === filtros.status;
    const matchPlano = !filtros.planoId || empresa.planoId === filtros.planoId;
    
    return matchNome && matchStatus && matchPlano;
  });

  const limparFiltros = () => {
    setFiltros({
      nome: '',
      status: '',
      planoId: ''
    });
  };

  const handleEditEmpresa = (empresa) => {
    setEditingEmpresa({ ...empresa });
    setShowEditModal(true);
  };

  const handleUpdateEmpresa = async (e) => {
    e.preventDefault();
    
    const updatePromise = updateEmpresa(editingEmpresa.id, editingEmpresa);
    
    toast.promise(updatePromise, {
      loading: 'Atualizando empresa...',
      success: 'Empresa atualizada com sucesso!',
      error: 'Erro ao atualizar empresa'
    });

    try {
      await updatePromise;
      setShowEditModal(false);
      setEditingEmpresa(null);
      await loadEmpresas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmpresa = (empresa) => {
    setEmpresaToDelete(empresa);
    setShowDeleteModal(true);
  };

  const confirmDeleteEmpresa = async () => {
    const deletePromise = deleteEmpresa(empresaToDelete.id);
    
    toast.promise(deletePromise, {
      loading: 'Excluindo empresa...',
      success: 'Empresa excluída com sucesso!',
      error: 'Erro ao excluir empresa'
    });

    try {
      await deletePromise;
      await loadEmpresas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockEmpresa = (empresa) => {
    setEmpresaToBlock(empresa);
    setShowBlockModal(true);
  };

  const confirmBlockEmpresa = async () => {
    const isBlocking = empresaToBlock.status === 'ATIVA';
    const actionText = isBlocking ? 'Bloqueando' : 'Desbloqueando';
    const successText = isBlocking ? 'Empresa bloqueada com sucesso!' : 'Empresa desbloqueada com sucesso!';
    const errorText = isBlocking ? 'Erro ao bloquear empresa' : 'Erro ao desbloquear empresa';
    
    const blockPromise = blockEmpresa(empresaToBlock.id);
    
    toast.promise(blockPromise, {
      loading: `${actionText} empresa...`,
      success: successText,
      error: errorText
    });

    try {
      await blockPromise;
      await loadEmpresas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewEmpresa = (empresa) => {
    setEmpresaToView(empresa);
    setShowViewModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status) => {
    const classes = status === 'ATIVA' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes}`}>
        {status === 'ATIVA' ? '✅ Ativa' : '❌ Bloqueada'}
      </span>
    );
  };

  const handleCreateEmpresa = async (e) => {
    e.preventDefault();
    
    const createPromise = createEmpresa(newEmpresa);
    
    toast.promise(createPromise, {
      loading: 'Criando empresa...',
      success: 'Empresa criada com sucesso!',
      error: 'Erro ao criar empresa'
    });

    try {
      await createPromise;
      setShowCreateModal(false);
      setNewEmpresa({
        nome: '',
        emailContato: '',
        telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        status: 'ATIVA',
        planoId: null
      });
      await loadEmpresas();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando empresas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => setShowFiltros(!showFiltros)}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFiltros && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={filtros.nome}
                onChange={(e) => setFiltros({...filtros, nome: e.target.value})}
                placeholder="Buscar por nome..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="ATIVA">Ativa</option>
                <option value="BLOQUEADA">Bloqueada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plano
              </label>
              <select
                value={filtros.planoId}
                onChange={(e) => setFiltros({...filtros, planoId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {planos.map(plano => (
                  <option key={plano.id} value={plano.id}>
                    {plano.nome} - R$ {plano.preco}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={limparFiltros}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {empresasFiltradas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {empresas.length === 0 ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa corresponde aos filtros aplicados'}
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Telefone
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Plano
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Usuários
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Eventos
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Criado em
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{empresa.nome}</div>
                      <div className="text-xs text-gray-500 md:hidden">{empresa.emailContato}</div>
                      {empresa.telefone && (
                        <div className="text-xs text-gray-500 md:hidden">{empresa.telefone}</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{empresa.emailContato}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {empresa.telefone || '-'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {empresa.plano?.nome || 'Sem plano'}
                      </div>
                      {empresa.plano && (
                        <div className="text-xs text-gray-500">
                          R$ {empresa.plano.preco}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(empresa.status)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                      {empresa._count?.usuarios || 0}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                      {empresa._count?.eventos || 0}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      {formatDate(empresa.criadoEm)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        <button 
                          onClick={() => handleViewEmpresa(empresa)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Ver detalhes"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Ver</span>
                        </button>
                        <button 
                          onClick={() => handleEditEmpresa(empresa)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          title="Editar empresa"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                        {empresa.status === 'ATIVA' ? (
                          <button 
                            onClick={() => handleBlockEmpresa(empresa)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            title="Bloquear empresa"
                          >
                            <LockClosedIcon className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Bloquear</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleBlockEmpresa(empresa)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title="Desbloquear empresa"
                          >
                            <LockClosedIcon className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Desbloquear</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteEmpresa(empresa)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Excluir empresa"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && editingEmpresa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Empresa</h2>
            <form onSubmit={handleUpdateEmpresa}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={editingEmpresa.nome}
                  onChange={(e) => setEditingEmpresa({...editingEmpresa, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Contato
                </label>
                <input
                  type="email"
                  value={editingEmpresa.emailContato}
                  onChange={(e) => setEditingEmpresa({...editingEmpresa, emailContato: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={editingEmpresa.telefone || ''}
                  onChange={(e) => setEditingEmpresa({...editingEmpresa, telefone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={editingEmpresa.endereco || ''}
                  onChange={(e) => setEditingEmpresa({...editingEmpresa, endereco: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={editingEmpresa.cidade || ''}
                    onChange={(e) => setEditingEmpresa({...editingEmpresa, cidade: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={editingEmpresa.estado || ''}
                    onChange={(e) => setEditingEmpresa({...editingEmpresa, estado: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={editingEmpresa.cep || ''}
                    onChange={(e) => setEditingEmpresa({...editingEmpresa, cep: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00000-000"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plano
                </label>
                <select
                  value={editingEmpresa.planoId || ''}
                  onChange={(e) => setEditingEmpresa({...editingEmpresa, planoId: e.target.value || null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem plano</option>
                  {planos.map(plano => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome} - R$ {plano.preco}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editingEmpresa.status}
                  onChange={(e) => setEditingEmpresa({...editingEmpresa, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ATIVA">Ativa</option>
                  <option value="BLOQUEADA">Bloqueada</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmpresa(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setEmpresaToDelete(null);
        }}
        onConfirm={confirmDeleteEmpresa}
        title="Excluir Empresa"
        message={`Tem certeza que deseja excluir a empresa "${empresaToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal de Confirmação de Bloqueio */}
      <ConfirmationModal
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          setEmpresaToBlock(null);
        }}
        onConfirm={confirmBlockEmpresa}
        title={empresaToBlock?.status === 'ATIVA' ? 'Bloquear Empresa' : 'Desbloquear Empresa'}
        message={empresaToBlock?.status === 'ATIVA' 
          ? `Tem certeza que deseja bloquear a empresa "${empresaToBlock?.nome}"? Os usuários não conseguirão mais acessar o sistema.`
          : `Tem certeza que deseja desbloquear a empresa "${empresaToBlock?.nome}"? Os usuários voltarão a ter acesso ao sistema.`
        }
        confirmText={empresaToBlock?.status === 'ATIVA' ? 'Bloquear' : 'Desbloquear'}
        cancelText="Cancelar"
        type={empresaToBlock?.status === 'ATIVA' ? 'warning' : 'success'}
      />

      {/* Modal de Visualização */}
      {showViewModal && empresaToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detalhes da Empresa</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setEmpresaToView(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Informações Básicas</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nome da Empresa</label>
                    <p className="text-sm text-gray-900 mt-1">{empresaToView.nome}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email de Contato</label>
                    <p className="text-sm text-gray-900 mt-1">{empresaToView.emailContato}</p>
                  </div>
                  {empresaToView.telefone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Telefone</label>
                      <p className="text-sm text-gray-900 mt-1">{empresaToView.telefone}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(empresaToView.status)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Data de Criação</label>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(empresaToView.criadoEm)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Endereço</h3>
                <div className="space-y-3">
                  {empresaToView.endereco && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Endereço</label>
                      <p className="text-sm text-gray-900 mt-1">{empresaToView.endereco}</p>
                    </div>
                  )}
                  {empresaToView.cidade && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Cidade</label>
                      <p className="text-sm text-gray-900 mt-1">{empresaToView.cidade}</p>
                    </div>
                  )}
                  {empresaToView.estado && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Estado</label>
                      <p className="text-sm text-gray-900 mt-1">{empresaToView.estado}</p>
                    </div>
                  )}
                  {empresaToView.cep && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">CEP</label>
                      <p className="text-sm text-gray-900 mt-1">{empresaToView.cep}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Plano e Estatísticas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Plano Atual</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {empresaToView.plano?.nome || 'Sem plano'}
                  </p>
                  {empresaToView.plano && (
                    <p className="text-xs text-gray-500 mt-1">
                      R$ {empresaToView.plano.preco}/mês
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Total de Usuários</label>
                  <p className="text-sm text-gray-900 mt-1">{empresaToView._count?.usuarios || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Total de Eventos</label>
                  <p className="text-sm text-gray-900 mt-1">{empresaToView._count?.eventos || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setEmpresaToView(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nova Empresa</h2>
            <form onSubmit={handleCreateEmpresa}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={newEmpresa.nome}
                  onChange={(e) => setNewEmpresa({...newEmpresa, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Contato
                </label>
                <input
                  type="email"
                  value={newEmpresa.emailContato}
                  onChange={(e) => setNewEmpresa({...newEmpresa, emailContato: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={newEmpresa.telefone}
                  onChange={(e) => setNewEmpresa({...newEmpresa, telefone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={newEmpresa.endereco}
                  onChange={(e) => setNewEmpresa({...newEmpresa, endereco: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={newEmpresa.cidade}
                    onChange={(e) => setNewEmpresa({...newEmpresa, cidade: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={newEmpresa.estado}
                    onChange={(e) => setNewEmpresa({...newEmpresa, estado: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={newEmpresa.cep}
                    onChange={(e) => setNewEmpresa({...newEmpresa, cep: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00000-000"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plano
                </label>
                <select
                  value={newEmpresa.planoId || ''}
                  onChange={(e) => setNewEmpresa({...newEmpresa, planoId: e.target.value || null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem plano</option>
                  {planos.map(plano => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome} - R$ {plano.preco}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newEmpresa.status}
                  onChange={(e) => setNewEmpresa({...newEmpresa, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ATIVA">Ativa</option>
                  <option value="BLOQUEADA">Bloqueada</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewEmpresa({
                      nome: '',
                      emailContato: '',
                      telefone: '',
                      endereco: '',
                      cidade: '',
                      estado: '',
                      cep: '',
                      status: 'ATIVA',
                      planoId: null
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 