import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  User as UserIcon,
  Upload as UploadIcon
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import DatePicker from 'react-multi-date-picker';

const GerenciarEquipe = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados do modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // create, edit, view, delete
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    nivel: 'CHECKIN',
    eventosIds: [],
    trabalharTodosEventos: false,
    fotoPerfil: '',
    endereco: '',
    cpf: '',
    dataNascimento: '',
    pix: '',
    trabalhou: false,
    diasTrabalhados: [],
    eventosTrabalhados: [],
    pagamentos: [],
    foiPago: false,
    podeGerenciarDemandas: false
  });
  
  // Estados de filtro
  const [filtros, setFiltros] = useState({
    nome: '',
    email: '',
    nivel: '',
    status: ''
  });

  // Adicione um estado para a senha temporária
  const [senhaTemporaria, setSenhaTemporaria] = useState('');

  // Adicionar estado para abas
  const [aba, setAba] = useState('dados'); // 'dados', 'eventos', 'pagamentos', 'demandas'
  const fileInputRef = useRef();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários da equipe
      const usuariosResponse = await api.get('/users/equipe');
      setUsuarios(usuariosResponse.data || []);
      
      // Buscar eventos da empresa
      const eventosResponse = await api.get('/events');
      console.log('DEBUG eventosResponse.data:', eventosResponse.data);
      let eventosArr = [];
      if (Array.isArray(eventosResponse.data)) {
        eventosArr = eventosResponse.data;
      } else if (eventosResponse.data && Array.isArray(eventosResponse.data.data)) {
        eventosArr = eventosResponse.data.data;
      } else if (eventosResponse.data && eventosResponse.data.events) {
        eventosArr = eventosResponse.data.events;
      }
      setEventos(eventosArr);
    } catch (err) {
      console.error('Erro ao carregar dados:', err, err.response?.data);
      setError('Erro ao carregar dados da equipe: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      nivel: 'CHECKIN',
      eventosIds: [],
      trabalharTodosEventos: false,
      fotoPerfil: '',
      endereco: '',
      cpf: '',
      dataNascimento: '',
      pix: '',
      trabalhou: false,
      diasTrabalhados: [],
      eventosTrabalhados: [],
      pagamentos: [],
      foiPago: false,
      podeGerenciarDemandas: false
    });
  };

  const handleOpenModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    
    if (type === 'create') {
      resetForm();
    } else if (type === 'edit' && user) {
      setFormData({
        nome: user.name,
        email: user.email,
        telefone: user.telefone || '',
        nivel: user.nivel || 'CHECKIN',
        eventosIds: user.eventosIds || [],
        trabalharTodosEventos: user.trabalharTodosEventos || false,
        fotoPerfil: user.fotoPerfil || '',
        endereco: user.endereco || '',
        cpf: user.cpf || '',
        dataNascimento: user.dataNascimento || '',
        pix: user.pix || '',
        trabalhou: user.trabalhou || false,
        diasTrabalhados: user.diasTrabalhados || [],
        eventosTrabalhados: user.eventosTrabalhados || [],
        pagamentos: user.pagamentos || [],
        foiPago: user.foiPago || false,
        podeGerenciarDemandas: user.podeGerenciarDemandas || false
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      // Salvar arquivo temporariamente (exemplo: base64 ou url local)
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, fotoPerfil: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleEventoChange = (eventoId) => {
    setFormData(prev => ({
      ...prev,
      eventosIds: prev.eventosIds.includes(eventoId)
        ? prev.eventosIds.filter(id => id !== eventoId)
        : [...prev.eventosIds, eventoId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (modalType === 'create') {
        response = await api.post('/users/equipe', formData);
        setSenhaTemporaria(response.data.senhaTemporaria || '');
        toast.success('Usuário adicionado à equipe com sucesso!');
      } else if (modalType === 'edit' && selectedUser) {
        await api.put(`/users/equipe/${selectedUser.id}`, formData);
        toast.success('Usuário atualizado com sucesso!');
      }
      
      handleCloseModal();
      await loadData();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      toast.error(err.response?.data?.message || 'Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/equipe/${userToDelete.id}`);
      toast.success('Usuário removido da equipe com sucesso!');
      setShowDeleteModal(false);
      setUserToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Erro ao remover usuário:', err);
      toast.error(err.response?.data?.message || 'Erro ao remover usuário');
    }
  };

  const getNivelBadge = (nivel) => {
    const nivelConfig = {
      'ADMIN': {
        className: 'bg-red-100 text-red-800',
        text: 'Administrador'
      },
      'EDITOR': {
        className: 'bg-blue-100 text-blue-800',
        text: 'Editor'
      },
      'CHECKIN': {
        className: 'bg-green-100 text-green-800',
        text: 'Check-in'
      }
    };

    const config = nivelConfig[nivel] || nivelConfig['CHECKIN'];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (ativo) => {
    return ativo ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ativo
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inativo
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchNome = !filtros.nome || usuario.name.toLowerCase().includes(filtros.nome.toLowerCase());
    const matchEmail = !filtros.email || usuario.email.toLowerCase().includes(filtros.email.toLowerCase());
    const matchNivel = !filtros.nivel || usuario.nivel === filtros.nivel;
    const matchStatus = !filtros.status || (filtros.status === 'ativo' ? usuario.ativo : !usuario.ativo);
    
    return matchNome && matchEmail && matchNivel && matchStatus;
  });

  const clearFilters = () => {
    setFiltros({
      nome: '',
      email: '',
      nivel: '',
      status: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando equipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Equipe</h1>
              <p className="mt-1 text-sm text-gray-500">
                Adicione e gerencie membros da sua equipe
              </p>
            </div>
            <button
              onClick={() => handleOpenModal('create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filtros.nome}
                  onChange={(e) => setFiltros(prev => ({ ...prev, nome: e.target.value }))}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Buscar por nome..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="text"
                value={filtros.email}
                onChange={(e) => setFiltros(prev => ({ ...prev, email: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar por email..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nível
              </label>
              <select
                value={filtros.nivel}
                onChange={(e) => setFiltros(prev => ({ ...prev, nivel: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Todos os níveis</option>
                <option value="ADMIN">Administrador</option>
                <option value="EDITOR">Editor</option>
                <option value="CHECKIN">Check-in</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {filteredUsuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filtros.nome || filtros.email || filtros.nivel || filtros.status 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece adicionando um usuário à sua equipe.'}
              </p>
              {!filtros.nome && !filtros.email && !filtros.nivel && !filtros.status && (
                <div className="mt-6">
                  <button
                    onClick={() => handleOpenModal('create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Usuário
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredUsuarios.map((usuario) => (
                <li key={usuario.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {usuario.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">{usuario.name}</h3>
                          {getNivelBadge(usuario.nivel)}
                          {/* Badge de Demandas */}
                          {usuario.podeGerenciarDemandas ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-base font-medium">
                              Demandas
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-base font-medium">
                              Demandas
                            </span>
                          )}
                          {getStatusBadge(usuario.ativo)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {usuario.email}
                          {usuario.telefone && ` • ${usuario.telefone}`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Criado em {formatDate(usuario.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal('view', usuario)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleOpenModal('edit', usuario)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-blue-400 hover:text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {usuario.id !== user.id && (
                        <button
                          onClick={() => {
                            setUserToDelete(usuario);
                            setShowDeleteModal(true);
                          }}
                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-red-400 hover:text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'create' ? 'Adicionar Usuário' : 
                   modalType === 'edit' ? 'Editar Usuário' : 'Visualizar Usuário'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Abas */}
                <div className="flex border-b mb-4">
                  <button className={`px-4 py-2 ${aba==='dados' ? 'border-b-2 border-blue-600 font-bold' : ''}`} onClick={e => {e.preventDefault(); setAba('dados')}}>Dados</button>
                  <button className={`px-4 py-2 ${aba==='eventos' ? 'border-b-2 border-blue-600 font-bold' : ''}`} onClick={e => {e.preventDefault(); setAba('eventos')}}>Eventos</button>
                  <button className={`px-4 py-2 ${aba==='pagamentos' ? 'border-b-2 border-blue-600 font-bold' : ''}`} onClick={e => {e.preventDefault(); setAba('pagamentos')}}>Pagamentos</button>
                  <button className={`px-4 py-2 ${aba==='demandas' ? 'border-b-2 border-blue-600 font-bold' : ''}`} onClick={e => {e.preventDefault(); setAba('demandas')}}>Demandas</button>
                </div>
                {/* Conteúdo das abas */}
                {aba === 'dados' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="md:col-span-2 w-full flex flex-col gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                          <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} required className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4" placeholder="Nome completo" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                          <input type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4" placeholder="(11) 99999-9999" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4" placeholder="email@exemplo.com" />
                        </div>
                      </div>
                      <div className="flex flex-col items-center md:col-span-1">
                        <div className="w-36 h-36 rounded-full bg-blue-100 flex items-center justify-center mb-2 border-2 border-blue-200 shadow overflow-hidden">
                          {formData.fotoPerfil ? (
                            <img src={formData.fotoPerfil} alt="Foto de perfil" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-20 h-20 text-blue-400" />
                          )}
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil</label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <UploadIcon className="w-4 h-4" /> Anexar Imagem
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          name="fotoPerfil"
                          ref={fileInputRef}
                          onChange={handleInputChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                        <input type="text" name="endereco" value={formData.endereco} onChange={handleInputChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4" placeholder="Rua, número, bairro, cidade" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chave Pix</label>
                        <input type="text" name="pix" value={formData.pix} onChange={handleInputChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4" placeholder="Chave Pix para pagamento" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                        <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4" placeholder="000.000.000-00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                        <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleInputChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4" />
                      </div>
                    </div>
                  </>
                )}
                {aba === 'pagamentos' && (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" name="trabalhou" checked={formData.trabalhou} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span className="ml-2 text-sm text-gray-700">Já trabalhou em algum evento</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dias Trabalhados</label>
                      <DatePicker
                        multiple
                        value={formData.diasTrabalhados}
                        onChange={dates => setFormData(prev => ({ ...prev, diasTrabalhados: dates.map(d => d.format ? d.format('YYYY-MM-DD') : d) }))}
                        format="YYYY-MM-DD"
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4"
                        placeholder="Selecione os dias trabalhados"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eventos Trabalhados</label>
                      <input type="text" name="eventosTrabalhados" value={formData.eventosTrabalhados.join(', ')} onChange={e => setFormData(prev => ({ ...prev, eventosTrabalhados: e.target.value.split(',').map(s => s.trim()) }))} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4" placeholder="IDs dos eventos separados por vírgula" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pagamentos (JSON)</label>
                      <textarea name="pagamentos" value={JSON.stringify(formData.pagamentos)} onChange={e => setFormData(prev => ({ ...prev, pagamentos: JSON.parse(e.target.value || '[]') }))} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4" placeholder='Ex: [{"valor":100,"data":"2024-06-01","eventoId":"abc","status":"pago"}]' />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" name="foiPago" checked={formData.foiPago} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span className="ml-2 text-sm text-gray-700">Já foi pago</span>
                      </label>
                    </div>
                  </div>
                )}
                {aba === 'eventos' && (
                  <div className="mb-6 mt-4">
                    <label className="block font-semibold mb-2">Permissões e Eventos</label>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso *</label>
                      <select name="nivel" value={formData.nivel} onChange={handleInputChange} required className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base h-12 px-4">
                        <option value="CHECKIN">Check-in (Apenas check-in nos eventos)</option>
                        <option value="EDITOR">Editor (Editor de página + check-in)</option>
                        <option value="ADMIN">Administrador (Acesso total à empresa)</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input type="checkbox" name="trabalharTodosEventos" checked={formData.trabalharTodosEventos} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span className="ml-2 text-sm text-gray-700">Trabalhar em todos os eventos da empresa</span>
                      </label>
                    </div>
                    <label className="block font-semibold mb-2">Selecionar Eventos Específicos</label>
                    {eventos.length === 0 && (
                      <div className="text-red-500 text-sm mb-2">Nenhum evento encontrado para este usuário.</div>
                    )}
                    <div className="flex flex-col gap-2">
                      {eventos.map(evento => (
                        <label key={evento.id} className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.eventosIds.includes(evento.id)} onChange={() => handleEventoChange(evento.id)} />
                          {evento.name} {evento.date ? `(${new Date(evento.date).toLocaleDateString()})` : ''}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {aba === 'demandas' && (
                  <div className="mb-6 mt-4">
                    <label className="block font-semibold mb-2">Permissões de Demandas</label>
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input type="checkbox" name="podeGerenciarDemandas" checked={formData.podeGerenciarDemandas || false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span className="ml-2 text-sm text-gray-700">Pode gerenciar demandas (criar, editar, excluir)</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Se marcado, este usuário poderá criar, editar e excluir demandas. Caso contrário, poderá apenas visualizar.</p>
                    </div>
                  </div>
                )}
                {/* Rodapé fixo dos botões */}
                <div className="flex justify-end space-x-3 pt-4 border-t mt-6 pt-6">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancelar</button>
                  <button type="submit" className="px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{modalType === 'create' ? 'Adicionar' : 'Salvar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title="Remover Usuário"
        message={`Tem certeza que deseja remover "${userToDelete?.name}" da equipe? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Adicione um modal para exibir a senha temporária */}
      {senhaTemporaria && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-[400px] max-w-full relative flex flex-col gap-2">
            <button className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-700" onClick={() => setSenhaTemporaria('')}>&times;</button>
            <h3 className="text-xl font-bold mb-4 text-primary-700 text-center">Senha temporária do novo membro</h3>
            <div className="mb-3 text-center">
              <span className="font-mono text-lg bg-gray-100 px-4 py-2 rounded select-all">{senhaTemporaria}</span>
            </div>
            <div className="text-sm text-gray-500 text-center mb-2">Copie e envie esta senha ao novo membro da equipe. Ele poderá alterá-la após o primeiro login.</div>
            <div className="flex justify-center mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setSenhaTemporaria('')}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciarEquipe; 