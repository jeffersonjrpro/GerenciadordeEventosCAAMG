import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Save, 
  Eye, 
  Copy, 
  Type,
  Image,
  Calendar,
  MapPin,
  User,
  Settings,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Users
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import api from '../services/api';
import { Link } from 'react-router-dom';

// Adicionar PreviewCountdown no topo do arquivo
function PreviewCountdown({ tipo }) {
  // Simula um tempo qualquer
  const timeLeft = { days: 7, hours: 16, minutes: 56, seconds: 19 };
  if (tipo === 'none') return null;
  if (tipo === 'minimal') {
    return (
      <div className="text-center py-2">
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Contagem Regressiva</h3>
        <div className="flex justify-center space-x-2">
          <div className="text-center">
            <div className="bg-gray-200 text-gray-900 text-xl font-bold rounded px-3 py-1 min-w-[48px]">{timeLeft.days}</div>
            <div className="text-xs mt-1">Dias</div>
          </div>
          <div className="text-center">
            <div className="bg-gray-200 text-gray-900 text-xl font-bold rounded px-3 py-1 min-w-[48px]">{timeLeft.hours}</div>
            <div className="text-xs mt-1">Horas</div>
          </div>
          <div className="text-center">
            <div className="bg-gray-200 text-gray-900 text-xl font-bold rounded px-3 py-1 min-w-[48px]">{timeLeft.minutes}</div>
            <div className="text-xs mt-1">Min</div>
          </div>
          <div className="text-center">
            <div className="bg-gray-200 text-gray-900 text-xl font-bold rounded px-3 py-1 min-w-[48px]">{timeLeft.seconds}</div>
            <div className="text-xs mt-1">Seg</div>
          </div>
        </div>
      </div>
    );
  }
  if (tipo === 'modern') {
    return (
      <div className="text-center py-4">
        <h3 className="text-xl font-bold text-blue-700 mb-2">Contagem Regressiva</h3>
        <div className="flex justify-center space-x-2">
          <div className="text-center">
            <div className="bg-blue-600 text-white text-2xl font-bold rounded-lg px-3 py-1 min-w-[56px] shadow-lg">{String(timeLeft.days).padStart(2, '0')}</div>
            <div className="text-blue-700 text-xs mt-1">Dias</div>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white text-2xl font-bold rounded-lg px-3 py-1 min-w-[56px] shadow-lg">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="text-blue-700 text-xs mt-1">Horas</div>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white text-2xl font-bold rounded-lg px-3 py-1 min-w-[56px] shadow-lg">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="text-blue-700 text-xs mt-1">Min</div>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white text-2xl font-bold rounded-lg px-3 py-1 min-w-[56px] shadow-lg">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="text-blue-700 text-xs mt-1">Seg</div>
          </div>
        </div>
      </div>
    );
  }
  // NOVOS ESTILOS
  if (tipo === 'neon-circular') {
    // Circular Pontilhado Neon
    const circle = (value, total, label) => {
      const dots = [];
      for (let i = 0; i < total; i++) {
        dots.push(
          <span
            key={i}
            className={`inline-block w-2 h-2 rounded-full mx-[1.5px] my-0 ${i < value ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-gray-700'}`}
          />
        );
      }
      return (
        <div className="flex flex-col items-center mx-2">
          <div className="relative flex items-center justify-center">
            <div className="absolute flex flex-wrap w-14 h-14 items-center justify-center" style={{transform: 'rotate(-90deg)'}}>
              {dots}
            </div>
            <div className="relative z-10 text-3xl font-extrabold text-white drop-shadow-[0_0_8px_cyan] min-w-[44px] text-center">{String(value).padStart(2, '0')}</div>
          </div>
          <div className="text-xs text-cyan-300 mt-1 uppercase tracking-widest">{label}</div>
        </div>
      );
    };
    return (
      <div className="bg-black rounded-xl py-4 px-2">
        <div className="flex justify-center gap-4">
          {circle(timeLeft.days, 30, 'Dias')}
          {circle(timeLeft.hours, 24, 'Horas')}
          {circle(timeLeft.minutes, 60, 'Min')}
          {circle(timeLeft.seconds, 60, 'Seg')}
        </div>
      </div>
    );
  }
  if (tipo === 'flip-card') {
    // Flip Card (Cartão Virando)
    const card = (value, label) => (
      <div className="flex flex-col items-center mx-2">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 text-white text-4xl font-extrabold rounded-xl w-16 h-20 flex items-center justify-center shadow-lg relative border-b-4 border-gray-700">
          <div className="absolute top-1/2 left-0 w-full border-t border-gray-600 opacity-60"></div>
          <span className="z-10">{String(value).padStart(2, '0')}</span>
        </div>
        <div className="text-xs text-yellow-400 mt-1 uppercase tracking-widest">{label}</div>
      </div>
    );
    return (
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-xl py-4 px-2">
        <div className="flex justify-center gap-4">
          {card(timeLeft.days, 'Dias')}
          {card(timeLeft.hours, 'Horas')}
          {card(timeLeft.minutes, 'Min')}
          {card(timeLeft.seconds, 'Seg')}
        </div>
      </div>
    );
  }
  if (tipo === 'progress-circular') {
    // Circular Progressivo Colorido
    const progressCircle = (value, max, label, color) => {
      const percent = (value / max) * 100;
      return (
        <div className="flex flex-col items-center mx-2">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="absolute top-0 left-0" width="64" height="64">
              <circle cx="32" cy="32" r="28" stroke="#222" strokeWidth="6" fill="none" />
              <circle
                cx="32" cy="32" r="28"
                stroke={color}
                strokeWidth="6"
                fill="none"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - percent / 100)}
                strokeLinecap="round"
                style={{transition: 'stroke-dashoffset 0.5s'}}
              />
            </svg>
            <span className="relative z-10 text-2xl font-bold text-white">{String(value).padStart(2, '0')}</span>
          </div>
          <div className="text-xs text-blue-300 mt-1 uppercase tracking-widest">{label}</div>
        </div>
      );
    };
    return (
      <div className="bg-gradient-to-b from-blue-950 to-black rounded-xl py-4 px-2">
        <div className="flex justify-center gap-4">
          {progressCircle(timeLeft.days, 30, 'Dias', 'url(#grad1)')}
          {progressCircle(timeLeft.hours, 24, 'Horas', '#38bdf8')}
          {progressCircle(timeLeft.minutes, 60, 'Min', '#22d3ee')}
          {progressCircle(timeLeft.seconds, 60, 'Seg', '#4ade80')}
          <svg width="0" height="0">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    );
  }
  if (tipo === 'digital-glow') {
    // Digital com Glow
    const digital = (value, label) => (
      <div className="flex flex-col items-center mx-2">
        <div className="bg-black text-cyan-400 text-4xl font-mono font-extrabold rounded-lg w-16 h-20 flex items-center justify-center shadow-[0_0_16px_#22d3ee] border-2 border-cyan-400">
          <span className="drop-shadow-[0_0_8px_cyan]">{String(value).padStart(2, '0')}</span>
        </div>
        <div className="text-xs text-cyan-200 mt-1 uppercase tracking-widest">{label}</div>
      </div>
    );
    return (
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-xl py-4 px-2">
        <div className="flex justify-center gap-4">
          {digital(timeLeft.days, 'Dias')}
          {digital(timeLeft.hours, 'Horas')}
          {digital(timeLeft.minutes, 'Min')}
          {digital(timeLeft.seconds, 'Seg')}
        </div>
      </div>
    );
  }
  // padrão épico
  return (
    <div className="text-center py-4">
      <h3 className="text-xl font-bold text-white mb-2 bg-gradient-to-r from-red-900 via-red-800 to-black rounded-t-lg">Contagem Regressiva</h3>
      <div className="flex justify-center space-x-2">
        <div className="text-center">
          <div className="bg-red-600 text-white text-2xl font-bold rounded-lg px-3 py-1 min-w-[56px]">{String(timeLeft.days).padStart(2, '0')}</div>
          <div className="text-white text-xs mt-1">Dias</div>
        </div>
        <div className="text-center">
          <div className="bg-red-600 text-white text-2xl font-bold rounded-lg px-3 py-1 min-w-[56px]">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-white text-xs mt-1">Horas</div>
        </div>
        <div className="text-center">
          <div className="bg-red-600 text-white text-2xl font-bold rounded-lg px-3 py-1 min-w-[56px]">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-white text-xs mt-1">Min</div>
        </div>
        <div className="text-center">
          <div className="bg-red-600 text-white text-2xl font-bold rounded-lg px-3 py-1 min-w-[56px]">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-white text-xs mt-1">Seg</div>
        </div>
      </div>
    </div>
  );
}

const PublicPageEditor = ({ eventId, onSave }) => {
  const [config, setConfig] = useState({
    tema: 'modern',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      buttonColor: '#3B82F6',
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
    },
    palestrantes: [],
    countdownType: 'epic' // Adicionado para controlar o tipo de contador
  });
  const [activeTab, setActiveTab] = useState('editor');
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimeout = useRef(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // Estados para modal de confirmação de salvamento
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Estado para popup de sucesso
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estado para popup de erro
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Estados para seletores de cores
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  
  // State for the main event description
  const [description, setDescription] = useState('');
  const [isDescriptionSaving, setIsDescriptionSaving] = useState(false);
  const descriptionSaveTimeout = useRef(null);

  const [quillError, setQuillError] = useState(false);

  // ReactQuill configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  const loadPageConfig = useCallback(async () => {
    try {
      console.log('🔍 loadPageConfig - Iniciando carregamento da configuração da página');
      const response = await api.get(`/events/${eventId}/public-page-config`);
      
      console.log('✅ loadPageConfig - Configuração da página carregada:', response.data);
      
      if (response.data) {
        const loadedConfig = response.data.data;
        console.log('🔍 loadPageConfig - loadedConfig.tema:', loadedConfig.tema);
        console.log('🔍 loadPageConfig - loadedConfig completo:', loadedConfig);
        
        setConfig(loadedConfig);
        
        // Also load event data for reference
        console.log('🔍 loadPageConfig - Carregando dados do evento');
        const eventResponse = await api.get(`/events/${eventId}`);
        
        console.log('✅ loadPageConfig - Dados do evento carregados:', eventResponse.data);
        
        if (eventResponse.data) {
          const eventData = eventResponse.data.data;
          setEventData(eventData);
          console.log('🔍 loadPageConfig - Descrição do evento:', eventData.description);
          setDescription(eventData.description || '');
          
          // Sincronizar a imagem do evento com a configuração da página
          if (eventData.imageUrl && !loadedConfig.header.imageUrl) {
            setConfig(prev => ({
              ...prev,
              header: {
                ...prev.header,
                imageUrl: eventData.imageUrl
              }
            }));
          }
        }
      }
    } catch (error) {
      console.error('❌ loadPageConfig - Erro ao carregar configuração da página:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadPageConfig();
  }, [loadPageConfig]);

  // Debug: logar mudanças na configuração
  useEffect(() => {
    console.log('🔍 config mudou - tema:', config.tema);
    console.log('🔍 config completa:', config);
  }, [config]);

  const saveDescription = useCallback(async (newDescription) => {
    console.log('🔍 saveDescription - Iniciando salvamento da descrição');
    console.log('🔍 saveDescription - newDescription:', newDescription);
    console.log('🔍 saveDescription - eventId:', eventId);
    console.log('🔍 saveDescription - Tamanho da descrição:', newDescription?.length || 0);
    setIsDescriptionSaving(true);
    try {
      const requestData = {
        description: newDescription
      };
      console.log('🔍 saveDescription - Dados da requisição:', requestData);
      
      const response = await api.put(`/events/${eventId}`, requestData);

      console.log('✅ saveDescription - Resposta da API:', response.data);
      console.log('✅ saveDescription - Status da resposta:', response.status);

      if (response.data) {
        // Atualizar o estado local do eventData
        setEventData(prev => ({
          ...prev,
            description: newDescription
        }));
        console.log('✅ saveDescription - Estado local atualizado');
      }

    } catch (error) {
      console.error('❌ saveDescription - Erro ao salvar descrição:', error);
      console.error('❌ saveDescription - error.response:', error.response);
      console.error('❌ saveDescription - error.message:', error.message);
      showErrorMessage('Não foi possível salvar a descrição.');
    } finally {
      setIsDescriptionSaving(false);
    }
  }, [eventId]);

  const handleDescriptionChange = (content) => {
    console.log('🔍 handleDescriptionChange - Conteúdo recebido:', content);
    setDescription(content);
    if (descriptionSaveTimeout.current) clearTimeout(descriptionSaveTimeout.current);
    descriptionSaveTimeout.current = setTimeout(() => {
      console.log('🔍 handleDescriptionChange - Executando saveDescription após debounce');
      saveDescription(content);
    }, 1500); // 1.5-second debounce
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      showErrorMessage('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorMessage('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post(`/events/${eventId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        // Atualizar a configuração da página com a nova URL da imagem
        const updatedConfig = {
          ...config,
          header: {
            ...config.header,
            imageUrl: response.data.data.imageUrl
          }
        };
        
        setConfig(updatedConfig);

        // Atualizar os dados do evento
        setEventData(prev => ({
          ...prev,
          data: {
            ...prev.data,
            imageUrl: response.data.data.imageUrl
          }
        }));

        // Salvar automaticamente a configuração da página
        await savePageConfig(updatedConfig);

        showSuccessMessage('Imagem atualizada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      showErrorMessage('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    setRemovingImage(true);
    try {
      await api.delete(`/events/${eventId}/image`);
      
      // Atualizar a configuração da página removendo a imagem
      const updatedConfig = {
        ...config,
        header: {
          ...config.header,
          imageUrl: ''
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

      setIsConfirmModalOpen(false);
      showSuccessMessage('Imagem removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      showErrorMessage('Erro ao remover imagem');
    } finally {
      setRemovingImage(false);
    }
  };

  const savePageConfig = async (configToSave) => {
    console.log('🔍 savePageConfig - Iniciando salvamento');
    console.log('🔍 savePageConfig - configToSave:', configToSave);
    console.log('🔍 savePageConfig - configToSave.tema:', configToSave.tema);
    
    setAutoSaving(true);
    try {
      const response = await api.put(`/events/${eventId}/public-page-config`, configToSave);

      if (response.data) {
        if (onSave) onSave(configToSave);
        console.log('✅ savePageConfig - Configuração da página salva automaticamente');
      }
    } catch (error) {
      console.error('❌ savePageConfig - Erro ao salvar configuração da página:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const getImageUrl = () => {
    const imageUrl = config.header.imageUrl || eventData?.imageUrl;
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    // Garantir que o caminho comece com /uploads/
    const normalizedPath = imageUrl.startsWith('/uploads/') ? imageUrl : `/uploads/${imageUrl}`;
    console.log('🔍 getImageUrl - imageUrl:', imageUrl);
    console.log('🔍 getImageUrl - normalizedPath:', normalizedPath);
    console.log('🔍 getImageUrl - baseUrl:', baseUrl);
    console.log('🔍 getImageUrl - final URL:', `${baseUrl}${normalizedPath}`);
    return `${baseUrl}${normalizedPath}`;
  };

  // Função para ajustar o brilho de uma cor
  const adjustBrightness = (hex, percent) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/events/${eventId}/public-page-config`, config);

      if (response.data) {
        if (onSave) onSave(config);
        setSaveSuccess(true);
        setTimeout(() => {
          setShowSaveConfirmModal(false);
          setSaveSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao salvar página:', error);
      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  const generateEmbedCode = () => {
    const embedUrl = `${window.location.origin}/event/${eventId}`;
    return `<iframe src="${embedUrl}" width="100%" height="800" frameborder="0" style="border: none;"></iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    showSuccessMessage('Código de incorporação copiado!');
  };

  const updateConfig = (section, updates, debounce = 500) => {
    let newConfig;
    
    // Se updates for uma string (como no caso do layout), atualizar diretamente
    if (typeof updates === 'string') {
      newConfig = {
        ...config,
        [section]: updates
      };
    } else {
      // Se updates for um objeto, mesclar com a seção existente
      newConfig = {
      ...config,
      [section]: { ...config[section], ...updates }
    };
    }
    
    console.log('🔍 updateConfig - section:', section);
    console.log('🔍 updateConfig - updates:', updates);
    console.log('🔍 updateConfig - newConfig:', newConfig);
    
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

  // Funções para o seletor de cores
  const closeColorPicker = () => {
    setActiveColorPicker(null);
  };

  const updateColor = (colorKey, color) => {
    updateTheme({ [colorKey]: color });
  };

  // Função para mostrar popup de sucesso
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
  };

  // Função para mostrar popup de erro
  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setShowErrorPopup(true);
    setTimeout(() => {
      setShowErrorPopup(false);
    }, 4000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div 
      style={{
        '--primary-color': config.theme?.primaryColor || '#3B82F6',
        '--secondary-color': config.theme?.secondaryColor || '#1E40AF',
        '--background-color': config.theme?.backgroundColor || '#FFFFFF',
        '--text-color': config.theme?.textColor || '#1F2937',
        '--button-color': config.theme?.buttonColor || '#3B82F6',
      }} 
      className="min-h-screen bg-gray-50"
    >
      
      <style>
        {`
          .btn-primary {
            background-color: var(--button-color) !important;
            border-color: var(--button-color) !important;
          }
          .btn-primary:hover {
            background-color: ${config.theme?.buttonColor ? 
              adjustBrightness(config.theme.buttonColor, -20) : '#2563EB'} !important;
          }
          .text-primary {
            color: var(--primary-color) !important;
          }
          .bg-primary {
            background-color: var(--primary-color) !important;
          }
          .border-primary {
            border-color: var(--primary-color) !important;
          }
          .bg-secondary {
            background-color: var(--secondary-color) !important;
          }
          .text-secondary {
            color: var(--secondary-color) !important;
          }
          .bg-custom-background {
            background-color: var(--background-color) !important;
          }
          .text-custom-text {
            color: var(--text-color) !important;
          }
          .header-bg {
            background-color: var(--primary-color) !important;
          }
          .header-text {
            color: var(--text-color) !important;
          }
          .card-bg {
            background-color: var(--background-color) !important;
          }
          .card-text {
            color: var(--text-color) !important;
          }
        `}
      </style>
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex space-x-3">
          <button
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => {
              const base = window.location.origin;
              const customSlug = eventData?.customSlug;
              const url = customSlug ? `${base}/e/${customSlug}` : `${base}/event/${eventId}`;
              window.open(url, '_blank');
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar Página Pública
          </button>
          <button
            onClick={copyEmbedCode}
            className="btn-outline inline-flex items-center"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Embed
          </button>
          <button
            onClick={() => setShowSaveConfirmModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Página
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex items-center justify-between">
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
            {/* Layout Settings */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Tema da Página
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="form-label">Estilo do Tema</label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
                    {/* Tema Moderno 1 */}
                    <div 
                      className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                        config.tema === 'modern' 
                          ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-200 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateConfig('tema', 'modern')}
                    >
                      <div className="text-center">
                        <div className="w-full h-20 bg-gradient-to-r from-blue-600 to-black rounded-2xl mb-2"></div>
                        <h4 className="font-semibold text-sm">Moderno Azul</h4>
                        <p className="text-xs text-gray-500 mt-1">Gradiente azul e preto, design atual</p>
                        {config.tema === 'modern' && (
                          <div className="mt-2 text-blue-700 text-xs font-medium">✓ Selecionado</div>
                        )}
                      </div>
                    </div>
                    {/* Tema Moderno 2 - Preto, Azul Marinho, Vermelho Escuro */}
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        config.tema === 'modern-dark' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateConfig('tema', 'modern-dark')}
                    >
                      <div className="text-center">
                        <div className="w-full h-20 bg-gradient-to-r from-black via-blue-900 to-red-900 rounded mb-2"></div>
                        <h4 className="font-semibold text-sm">Moderno Escuro</h4>
                        <p className="text-xs text-gray-500 mt-1">Preto, azul marinho e vermelho escuro</p>
                        {config.tema === 'modern-dark' && (
                          <div className="mt-2 text-primary-600 text-xs font-medium">✓ Selecionado</div>
                        )}
                      </div>
                    </div>
                    {/* Tema Evento Épico - Estilo Netflix */}
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        config.tema === 'epic' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateConfig('tema', 'epic')}
                    >
                      <div className="text-center">
                        <div className="w-full h-20 bg-gradient-to-r from-red-600 via-red-800 to-black rounded mb-2 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                        <h4 className="font-semibold text-sm">Evento Épico</h4>
                        <p className="text-xs text-gray-500 mt-1">Estilo Netflix, palestrantes, countdown</p>
                        {config.tema === 'epic' && (
                          <div className="mt-2 text-primary-600 text-xs font-medium">✓ Selecionado</div>
                        )}
                      </div>
                    </div>
                    {/* Tema Clássico */}
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        config.tema === 'classic' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateConfig('tema', 'classic')}
                    >
                      <div className="text-center">
                        <div className="w-full h-20 bg-gray-800 rounded mb-2"></div>
                        <h4 className="font-semibold text-sm">Clássico</h4>
                        <p className="text-xs text-gray-500 mt-1">Cabeçalho escuro tradicional</p>
                        {config.tema === 'classic' && (
                          <div className="mt-2 text-primary-600 text-xs font-medium">✓ Selecionado</div>
                        )}
                      </div>
                    </div>
                    {/* Tema Minimalista */}
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        config.tema === 'minimal' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateConfig('tema', 'minimal')}
                    >
                      <div className="text-center">
                        <div className="w-full h-20 bg-white border border-gray-200 rounded mb-2"></div>
                        <h4 className="font-semibold text-sm">Minimalista</h4>
                        <p className="text-xs text-gray-500 mt-1">Limpo e minimalista</p>
                        {config.tema === 'minimal' && (
                          <div className="mt-2 text-primary-600 text-xs font-medium">✓ Selecionado</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Após o card de seleção de tema, antes do card de cabeçalho */}
            <div className="card">
              <div className="card-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <label className="form-label block mb-2">Tipo de Contador</label>
                  <select
                    className="input w-full max-w-xs"
                    value={config.countdownType || 'epic'}
                    onChange={e => updateConfig('countdownType', e.target.value)}
                  >
                    <option value="none">Sem contador</option>
                    <option value="epic">Contador Épico</option>
                    <option value="modern">Contador Moderno</option>
                    <option value="minimal">Contador Minimalista</option>
                    <option value="neon-circular">Circular Neon</option>
                    <option value="flip-card">Cartão Flip</option>
                    <option value="progress-circular">Circular Progressivo</option>
                    <option value="digital-glow">Digital Glow</option>
                  </select>
                </div>
                <div className="flex-1 flex justify-center md:justify-end">
                  {/* Preview do contador */}
                  <div className="w-full max-w-xs">
                    <PreviewCountdown tipo={config.countdownType || 'epic'} />
                  </div>
                </div>
              </div>
            </div>

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
                <div>
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
                          onError={(e) => {
                            console.error('❌ Erro ao carregar imagem:', e.target.src);
                            e.target.style.display = 'none';
                          }}
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
                  <div className="min-h-[400px]">
                    {!quillError ? (
                      <div className="react-quill-wrapper">
                        <ReactQuill
                          theme="snow"
                          value={description}
                          onChange={handleDescriptionChange}
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Descreva seu evento de forma detalhada..."
                          className="bg-white"
                          style={{ height: '350px' }}
                          onError={(error) => {
                            console.error('ReactQuill error:', error);
                            setQuillError(true);
                          }}
                        />
                      </div>
                    ) : (
                      <textarea
                        value={description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        rows={15}
                        className="input w-full"
                        placeholder="Descreva seu evento de forma detalhada..."
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Use o editor acima para formatar o texto com títulos, listas, links e imagens.
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

            {/* Palestrantes Section - Only for Epic Theme */}
            {config.tema === 'epic' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Palestrantes do Evento
                </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Gerencie os palestrantes do seu evento épico
                  </p>
              </div>
                <div className="card-body">
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Gerenciar Palestrantes
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Adicione, edite e organize os palestrantes do seu evento
                    </p>
                    <Link
                      to={`/events/${eventId}/palestrantes`}
                      className="btn-primary inline-flex items-center"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Gerenciar Palestrantes
                    </Link>
                  </div>
                </div>
                  </div>
            )}
            </div>

          {/* Theme Panel */}
          <div className="space-y-6">
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

      {/* Modal de Confirmação de Salvamento */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-full max-w-md">
            <div className="relative bg-white rounded-lg shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                {saveSuccess ? (
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                )}
              </div>
              
              {/* Content */}
              <div className="text-center px-6 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {saveSuccess ? 'Página Salva!' : 'Confirmar Salvamento'}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {saveSuccess 
                    ? 'As alterações foram salvas com sucesso!'
                    : 'Tem certeza que deseja salvar as alterações da página?'
                  }
                </p>
                
                {/* Actions */}
                <div className="flex justify-center space-x-3">
                  {!saveSuccess && (
                    <button
                      onClick={() => setShowSaveConfirmModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  {!saveSuccess && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seletor de Cores */}
      {activeColorPicker && (
        <div className="fixed inset-0 z-50" onClick={closeColorPicker}>
          <div
            className="absolute bg-white rounded-lg shadow-xl border p-3"
            style={{
              left: colorPickerPosition.x,
              top: colorPickerPosition.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <HexColorPicker
              color={config.theme[activeColorPicker]}
              onChange={(color) => updateColor(activeColorPicker, color)}
            />
          </div>
        </div>
      )}

      {/* Popup de Sucesso */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowSuccessPopup(false)}></div>
          <div className="relative bg-white rounded-lg shadow-2xl p-6 max-w-sm mx-4 transform transition-all duration-300 ease-out scale-100">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sucesso!
              </h3>
              <p className="text-sm text-gray-600">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Erro */}
      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowErrorPopup(false)}></div>
          <div className="relative bg-white rounded-lg shadow-2xl p-6 max-w-sm mx-4 transform transition-all duration-300 ease-out scale-100">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erro!
              </h3>
              <p className="text-sm text-gray-600">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicPageEditor; 