import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  Save,
  User,
  Briefcase,
  Image as ImageIcon,
  ArrowLeft,
  Search
} from 'lucide-react';
import api from '../services/api';

const Palestrantes = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [palestrantes, setPalestrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPalestrante, setEditingPalestrante] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAtivo, setFilterAtivo] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    cargo: '',
    descricao: '',
    ordem: 0,
    ativo: true
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Função para processar URLs de imagem
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return null;
    }
    
    // Se já é uma URL completa, retornar como está
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Se é uma URL relativa, construir a URL completa
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Garantir que o caminho comece com /uploads/
    let normalizedPath = imageUrl;
    if (!imageUrl.startsWith('/uploads/') && !imageUrl.startsWith('/')) {
      normalizedPath = `/uploads/${imageUrl}`;
    } else if (imageUrl.startsWith('/') && !imageUrl.startsWith('/uploads/')) {
      normalizedPath = `/uploads${imageUrl}`;
    }
    
    const finalUrl = `${baseUrl}${normalizedPath}`;
    
    return finalUrl;
  };

  const fetchPalestrantes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}/palestrantes`);
      
      setPalestrantes(response.data);
    } catch (error) {
      console.error('❌ Erro ao carregar palestrantes:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchPalestrantes();
  }, [fetchPalestrantes]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Criar preview da nova imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nome', formData.nome);
      formDataToSend.append('cargo', formData.cargo);
      formDataToSend.append('descricao', formData.descricao);
      formDataToSend.append('ordem', formData.ordem.toString());
      formDataToSend.append('ativo', formData.ativo.toString());
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      if (editingPalestrante) {
        await api.put(`/events/${eventId}/palestrantes/${editingPalestrante.id}`, formDataToSend);
      } else {
        await api.post(`/events/${eventId}/palestrantes`, formDataToSend);
      }

      setShowModal(false);
      setEditingPalestrante(null);
      resetForm();
      fetchPalestrantes();
    } catch (error) {
      console.error('Erro ao salvar palestrante:', error);
      alert('Erro ao salvar palestrante. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (palestrante) => {
    
    setEditingPalestrante(palestrante);
    setFormData({
      nome: palestrante.nome,
      cargo: palestrante.cargo,
      descricao: palestrante.descricao,
      ordem: palestrante.ordem,
      ativo: palestrante.ativo
    });
    
    // Se o palestrante já tem imagem, usar a URL completa
    if (palestrante.imagem) {
      const imageUrl = getImageUrl(palestrante.imagem);
      setImagePreview(imageUrl);
    } else {
      setImagePreview(null);
    }
    
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleDelete = async (palestrante) => {
    if (window.confirm(`Tem certeza que deseja excluir o palestrante "${palestrante.nome}"?`)) {
      try {
        await api.delete(`/events/${eventId}/palestrantes/${palestrante.id}`);
        fetchPalestrantes();
      } catch (error) {
        console.error('Erro ao excluir palestrante:', error);
        alert('Erro ao excluir palestrante. Tente novamente.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cargo: '',
      descricao: '',
      ordem: 0,
      ativo: true
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const openModal = () => {
    setEditingPalestrante(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPalestrante(null);
    resetForm();
  };

  const filteredPalestrantes = palestrantes.filter(palestrante => {
    const matchesSearch = palestrante.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         palestrante.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAtivo === 'all' || 
                         (filterAtivo === 'active' && palestrante.ativo) ||
                         (filterAtivo === 'inactive' && !palestrante.ativo);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gerenciar Palestrantes</h1>
                <p className="text-sm text-gray-500">Adicione e gerencie os palestrantes do evento</p>
              </div>
            </div>
            <button
              onClick={openModal}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Palestrante
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar palestrantes..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="input"
                value={filterAtivo}
                onChange={(e) => setFilterAtivo(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {filteredPalestrantes.length} de {palestrantes.length} palestrantes
            </div>
          </div>
        </div>

        {/* Palestrantes Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredPalestrantes.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum palestrante encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterAtivo !== 'all' 
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece adicionando o primeiro palestrante.'
              }
            </p>
            <div className="mt-6">
              <button onClick={openModal} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Palestrante
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPalestrantes.map((palestrante) => {
              return (
                <div
                  key={palestrante.id}
                  className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${
                    !palestrante.ativo ? 'opacity-60' : ''
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-56 bg-gray-100 rounded-t-lg overflow-hidden">
                    {palestrante.imagem ? (
                      <img
                        src={getImageUrl(palestrante.imagem)}
                        alt={palestrante.nome}
                        className="w-full h-full object-cover object-center"
                        style={{ objectPosition: 'center top' }}
                        onError={(e) => {
                          console.error('❌ Erro ao carregar imagem:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={() => {
                          // Imagem carregada com sucesso
                        }}
                      />
                    ) : null}
                    <div className={`flex items-center justify-center h-full ${palestrante.imagem ? 'hidden' : ''}`}>
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        palestrante.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {palestrante.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {palestrante.nome}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {palestrante.cargo}
                        </div>
                        {palestrante.descricao && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {palestrante.descricao}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Ordem: {palestrante.ordem}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(palestrante)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(palestrante)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPalestrante ? 'Editar Palestrante' : 'Adicionar Palestrante'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="form-label">Foto do Palestrante</label>
                <div className="mt-2">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover object-center"
                            style={{ objectPosition: 'center top' }}
                            onError={(e) => {
                              console.error('❌ Erro ao carregar preview:', e.target.src);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log('✅ Preview carregado com sucesso:', imagePreview);
                            }}
                          />
                        ) : null}
                        <div className={`flex items-center justify-center h-full ${imagePreview ? 'hidden' : ''}`}>
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                        <Upload className="h-6 w-6 text-white" />
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="image-upload" className="btn-outline cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Escolher Imagem
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG ou GIF. Máximo 5MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Nome *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Cargo *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Descrição</label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Breve descrição do palestrante..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Ordem</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="input"
                    value={formData.ativo ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary inline-flex items-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingPalestrante ? 'Atualizar' : 'Adicionar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Palestrantes; 