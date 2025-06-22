import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { 
  Save, 
  Eye, 
  Copy, 
  Palette,
  Type,
  Image,
  Calendar,
  MapPin,
  User,
  Settings,
  Upload,
  Trash2,
  X
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const PublicPageEditor = ({ eventId, onSave }) => {
  const [config, setConfig] = useState({
    layout: 'modern',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937'
    },
    header: {
      title: '',
      subtitle: '',
      showImage: true,
      imageUrl: ''
    },
    content: {
      showDate: true,
      showLocation: true,
      showDescription: true,
      showOrganizer: true,
      customText: ''
    },
    registration: {
      showForm: true,
      buttonText: 'Inscrever-se',
      formTitle: 'Faça sua inscrição',
      formDescription: 'Preencha os dados abaixo para participar do evento',
      cardTitle: 'Ingressos'
    },
    footer: {
      showSocialLinks: false,
      customText: '© 2024 Sistema de Eventos'
    }
  });
  const [activeTab, setActiveTab] = useState('editor');
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimeout = useRef(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // State for the main event description
  const [description, setDescription] = useState('');
  const [isDescriptionSaving, setIsDescriptionSaving] = useState(false);
  const descriptionSaveTimeout = useRef(null);

  useEffect(() => {
    loadPageConfig();
  }, [eventId]);

  const loadPageConfig = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/public-page-config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
        
        // Also load event data for reference
        const eventResponse = await fetch(`/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          setEventData(eventData.data);
          setDescription(eventData.data.description || '');
          
          // Sincronizar a imagem do evento com a configuração da página
          if (eventData.data.imageUrl && !data.data.header.imageUrl) {
            setConfig(prev => ({
              ...prev,
              header: {
                ...prev.header,
                imageUrl: eventData.data.imageUrl
              }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração da página:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced function to save the description
  const saveDescription = useCallback(async (newDescription) => {
    setIsDescriptionSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ description: newDescription })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar a descrição');
      }

      // Optionally update local event data
      setEventData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          description: newDescription
        }
      }));

    } catch (error) {
      console.error('Erro ao salvar descrição:', error);
      alert('Não foi possível salvar a descrição.');
    } finally {
      setIsDescriptionSaving(false);
    }
  }, [eventId]);

  const handleDescriptionChange = (content) => {
    setDescription(content);
    if (descriptionSaveTimeout.current) clearTimeout(descriptionSaveTimeout.current);
    descriptionSaveTimeout.current = setTimeout(() => {
      saveDescription(content);
    }, 1500); // 1.5-second debounce
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`/api/events/${eventId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Atualizar a configuração da página com a nova URL da imagem
        const updatedConfig = {
          ...config,
          header: {
            ...config.header,
            imageUrl: data.data.imageUrl
          }
        };
        
        setConfig(updatedConfig);

        // Atualizar os dados do evento
        setEventData(prev => ({
          ...prev,
          data: {
            ...prev.data,
            imageUrl: data.data.imageUrl
          }
        }));

        // Salvar automaticamente a configuração da página
        await savePageConfig(updatedConfig);

        alert('Imagem atualizada com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    setIsConfirmModalOpen(false);
    setRemovingImage(true);

    try {
      const response = await fetch(`/api/events/${eventId}/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Remover a imagem da configuração da página
        const updatedConfig = {
          ...config,
          header: {
            ...config.header,
            imageUrl: null
          }
        };
        
        setConfig(updatedConfig);

        // Atualizar os dados do evento
        setEventData(prev => ({
          ...prev,
          data: {
            ...prev.data,
            imageUrl: null
          }
        }));

        // Salvar automaticamente a configuração da página
        await savePageConfig(updatedConfig);

        alert('Imagem removida com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao remover imagem: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      alert('Erro ao remover imagem');
    } finally {
      setRemovingImage(false);
    }
  };

  const savePageConfig = async (configToSave) => {
    setAutoSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}/public-page-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(configToSave)
      });

      if (response.ok) {
        if (onSave) onSave(configToSave);
        console.log('Configuração da página salva automaticamente');
      } else {
        console.error('Erro ao salvar configuração da página automaticamente');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração da página:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const getImageUrl = () => {
    // Priorizar a imagem da configuração da página, depois a do evento
    const imageUrl = config.header.imageUrl || eventData?.data?.imageUrl;
    if (!imageUrl) return null;
    
    // Se já é uma URL completa, retornar como está
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Se é um caminho relativo, construir a URL completa
    return `${window.location.origin}${imageUrl}`;
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/public-page-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        if (onSave) onSave(config);
        alert('Página salva com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar página:', error);
      alert('Erro ao salvar página');
    }
  };

  const generateEmbedCode = () => {
    const embedUrl = `${window.location.origin}/event/${eventId}`;
    return `<iframe src="${embedUrl}" width="100%" height="800" frameborder="0" style="border: none;"></iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    alert('Código de incorporação copiado!');
  };

  const updateConfig = (section, updates, debounce = 500) => {
    const newConfig = {
      ...config,
      [section]: { ...config[section], ...updates }
    };
    
    setConfig(newConfig);
    
    // Salvar automaticamente
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    autoSaveTimeout.current = setTimeout(() => {
      savePageConfig(newConfig);
    }, debounce);
  };

  const updateTheme = (updates) => {
    setConfig(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex space-x-3">
          <button
            onClick={copyEmbedCode}
            className="btn-outline inline-flex items-center"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Embed
          </button>
          <button
            onClick={handleSave}
            className="btn-primary inline-flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Página
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'editor'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Editor
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Visualizar
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Settings */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Type className="h-5 w-5 mr-2" />
                  Cabeçalho
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="form-label">Título da Página</label>
                  <input
                    type="text"
                    value={config.header.title}
                    onChange={(e) => updateConfig('header', { title: e.target.value })}
                    className="input"
                    placeholder="Título da página"
                  />
                </div>
                <div>
                  <label className="form-label">Subtítulo</label>
                  <textarea
                    value={config.header.subtitle}
                    onChange={(e) => updateConfig('header', { subtitle: e.target.value })}
                    rows={2}
                    className="input"
                    placeholder="Subtítulo ou descrição breve"
                  />
                </div>

                {/* Image Management Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="form-label">Imagem do Evento</label>
                      <p className="text-sm text-gray-500">Imagem que aparecerá no cabeçalho da página</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.header.showImage}
                        onChange={(e) => updateConfig('header', { showImage: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Current Image Display */}
                  {getImageUrl() && (
                    <div className="mb-4">
                      <div className="relative inline-block">
                        <img
                          src={getImageUrl()}
                          alt="Imagem do evento"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => setIsConfirmModalOpen(true)}
                          disabled={removingImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                          title="Remover imagem"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {removingImage && (
                        <p className="text-sm text-gray-500 mt-2">Removendo imagem...</p>
                      )}
                    </div>
                  )}

                  {/* Upload Section */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <label className="btn-outline cursor-pointer inline-flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        {getImageUrl() ? 'Alterar Imagem' : 'Adicionar Imagem'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                      {uploadingImage && (
                        <div className="flex items-center text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                          Fazendo upload...
                        </div>
                      )}
                    </div>
                    
                    {!getImageUrl() && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Nenhuma imagem selecionada
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Settings */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Conteúdo
                </h3>
              </div>
              <div className="card-body space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">Mostrar Data</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.content.showDate}
                        onChange={(e) => updateConfig('content', { showDate: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">Mostrar Local</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.content.showLocation}
                        onChange={(e) => updateConfig('content', { showLocation: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Type className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">Mostrar Descrição</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.content.showDescription}
                        onChange={(e) => updateConfig('content', { showDescription: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">Mostrar Organizador</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.content.showOrganizer}
                        onChange={(e) => updateConfig('content', { showOrganizer: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="form-label flex items-center justify-between">
                    <span>Descrição Principal do Evento</span>
                    {isDescriptionSaving && (
                       <span className="text-sm text-gray-500 flex items-center">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                         Salvando...
                       </span>
                    )}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    rows={6}
                    className="input"
                    placeholder="Descreva seu evento de forma detalhada..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Para formatação avançada, edite o evento na página de eventos.
                  </p>
                </div>

                <div>
                  <label className="form-label">Texto Personalizado Adicional</label>
                  <textarea
                    value={config.content.customText}
                    onChange={(e) => updateConfig('content', { customText: e.target.value })}
                    rows={4}
                    className="input"
                    placeholder="Texto adicional que aparecerá na página..."
                  />
                </div>
              </div>
            </div>

            {/* Registration Settings */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Inscrição</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="form-label">Mostrar Formulário</label>
                    <p className="text-sm text-gray-500">Exibir formulário de inscrição na página</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.registration.showForm}
                      onChange={(e) => updateConfig('registration', { showForm: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div>
                  <label className="form-label">Título do Card de Inscrição</label>
                  <input
                    type="text"
                    value={config.registration.cardTitle || 'Ingressos'}
                    onChange={(e) => updateConfig('registration', { cardTitle: e.target.value })}
                    className="input"
                    placeholder="Ex: Ingressos"
                  />
                </div>
                <div>
                  <label className="form-label">Texto do Botão</label>
                  <input
                    type="text"
                    value={config.registration.buttonText}
                    onChange={(e) => updateConfig('registration', { buttonText: e.target.value })}
                    className="input"
                    placeholder="Ex: Inscrever-se"
                  />
                </div>
                <div>
                  <label className="form-label">Título do Formulário</label>
                  <input
                    type="text"
                    value={config.registration.formTitle}
                    onChange={(e) => updateConfig('registration', { formTitle: e.target.value })}
                    className="input"
                    placeholder="Ex: Faça sua inscrição"
                  />
                </div>
                <div>
                  <label className="form-label">Descrição do Formulário</label>
                  <textarea
                    value={config.registration.formDescription}
                    onChange={(e) => updateConfig('registration', { formDescription: e.target.value })}
                    rows={2}
                    className="input"
                    placeholder="Ex: Preencha os dados abaixo para participar do evento"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Theme Panel */}
          <div className="space-y-6">
            {/* Color Theme */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Cores
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="form-label">Cor Primária</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border cursor-pointer"
                      style={{ backgroundColor: config.theme.primaryColor }}
                      onClick={() => {
                        const color = prompt('Digite a cor (hex):', config.theme.primaryColor);
                        if (color) updateTheme({ primaryColor: color });
                      }}
                    ></div>
                    <input
                      type="text"
                      value={config.theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      className="input flex-1"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Cor Secundária</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border cursor-pointer"
                      style={{ backgroundColor: config.theme.secondaryColor }}
                      onClick={() => {
                        const color = prompt('Digite a cor (hex):', config.theme.secondaryColor);
                        if (color) updateTheme({ secondaryColor: color });
                      }}
                    ></div>
                    <input
                      type="text"
                      value={config.theme.secondaryColor}
                      onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                      className="input flex-1"
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Cor de Fundo</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border cursor-pointer"
                      style={{ backgroundColor: config.theme.backgroundColor }}
                      onClick={() => {
                        const color = prompt('Digite a cor (hex):', config.theme.backgroundColor);
                        if (color) updateTheme({ backgroundColor: color });
                      }}
                    ></div>
                    <input
                      type="text"
                      value={config.theme.backgroundColor}
                      onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                      className="input flex-1"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Cor do Texto</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border cursor-pointer"
                      style={{ backgroundColor: config.theme.textColor }}
                      onClick={() => {
                        const color = prompt('Digite a cor (hex):', config.theme.textColor);
                        if (color) updateTheme({ textColor: color });
                      }}
                    ></div>
                    <input
                      type="text"
                      value={config.theme.textColor}
                      onChange={(e) => updateTheme({ textColor: e.target.value })}
                      className="input flex-1"
                      placeholder="#1F2937"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Embed Code */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Código de Incorporação</h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-gray-600 mb-3">
                  Use este código para incorporar a página em outros sites:
                </p>
                <div className="bg-gray-50 p-3 rounded border font-mono text-xs">
                  {generateEmbedCode()}
                </div>
                <button
                  onClick={copyEmbedCode}
                  className="btn-outline w-full mt-3"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Código
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Visualização da Página</h3>
                {autoSaving && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Salvando...
                  </div>
                )}
              </div>
            </div>
            <div className="card-body p-0">
              <iframe
                src={`/preview/event/${eventId}`}
                width="100%"
                height="800"
                frameBorder="0"
                style={{ border: 'none' }}
                title="Preview da página pública"
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleRemoveImage}
        title="Remover Imagem"
        message="Tem certeza que deseja remover a imagem do evento? Esta ação não pode ser desfeita."
        confirmText="Sim, Remover"
      />
    </div>
  );
};

export default PublicPageEditor; 