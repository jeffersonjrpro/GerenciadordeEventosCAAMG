import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import {
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Download,
  Share2,
  Lock
} from 'lucide-react';

const PublicEvent = () => {
  const { eventId, slug } = useParams();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [pageConfig, setPageConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [guest, setGuest] = useState(null);
  const [eventNotAvailable, setEventNotAvailable] = useState(false);

  // Verifica se está na rota do formulário
  const isFormOnly = location.pathname.includes('/formulario');
  const isPreview = location.pathname.includes('/preview/');
  
  // Determina se está usando slug ou ID
  const isUsingSlug = !!slug;
  const eventIdentifier = isUsingSlug ? slug : eventId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const fetchEventDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Se for preview, usa a API de preview sem restrições
      const eventEndpoint = isPreview 
        ? (isUsingSlug ? `/public/events/slug/${eventIdentifier}/preview` : `/public/events/${eventIdentifier}/preview`)
        : (isUsingSlug ? `/public/events/slug/${eventIdentifier}` : `/public/events/${eventIdentifier}`);
      
      // Primeiro tenta carregar o evento
      const eventResponse = await api.get(eventEndpoint);
      setEvent(eventResponse.data.data);

      // Carregar configuração do formulário (sempre necessário)
      try {
        const formEndpoint = isPreview 
          ? (isUsingSlug ? `/public/events/slug/${eventIdentifier}/form-config` : `/public/events/${eventIdentifier}/form-config/preview`)
          : (isUsingSlug ? `/public/events/slug/${eventIdentifier}/form-config` : `/public/events/${eventIdentifier}/form-config`);
        
        const formResponse = await api.get(formEndpoint);
        setFormConfig(formResponse.data.data);
      } catch (formError) {
        console.warn('⚠️ fetchEventDetails - Erro ao carregar formConfig:', formError);
        // Não é crítico, pode continuar sem configuração do formulário
      }

      // Se não for apenas formulário, carrega as configurações da página
      if (!isFormOnly) {
        // Carregar configuração da página
        try {
          const pageConfigEndpoint = isPreview 
            ? (isUsingSlug ? `/public/events/slug/${eventIdentifier}/page-config` : `/public/events/${eventIdentifier}/page-config`)
            : (isUsingSlug ? `/public/events/slug/${eventIdentifier}/page-config` : `/events/${eventIdentifier}/public-page-config`);
          
          const pageConfigResponse = await api.get(pageConfigEndpoint);
          setPageConfig(pageConfigResponse.data.data);
        } catch (pageConfigError) {
          console.warn('⚠️ fetchEventDetails - Erro ao carregar pageConfig:', pageConfigError);
          // Não é crítico, pode continuar sem configuração da página
        }
      }
    } catch (error) {
      console.error('❌ fetchEventDetails - erro ao carregar evento:', error);
      
      if (error.response?.status === 404) {
        setError('Evento não encontrado');
      } else if (error.response?.status === 403) {
        setEventNotAvailable(true);
        setError('Evento não está disponível publicamente');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao carregar evento. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [eventIdentifier, isUsingSlug, isPreview, isFormOnly]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.post(
        isUsingSlug 
          ? `/public/events/slug/${eventIdentifier}/guests/public`
          : `/public/events/${eventIdentifier}/guests/public`, 
        data
      );
      setGuest(response.data.data);
      setRegistrationSuccess(true);
      reset();
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      setError(error.response?.data?.message || 'Erro ao realizar inscrição. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    // Converter para fuso horário de Brasília
    const date = new Date(dateString);
    const brasiliaTime = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(date);
    
    return brasiliaTime;
  };

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

  const getEventStatus = (event) => {
    if (!event) return null;
    
    // Usar fuso horário de Brasília
    const now = new Date();
    const eventDate = new Date(event.date);
    
    // Converter para fuso horário de Brasília
    const brasiliaNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const brasiliaEventDate = new Date(eventDate.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    if (!event.isActive) {
      return { status: 'inactive', label: 'Evento Inativo', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    } else if (!event.isPublic) {
      return { status: 'private', label: 'Evento Privado', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    } else if (brasiliaEventDate < brasiliaNow) {
      return { status: 'finished', label: 'Evento Finalizado', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    } else if (brasiliaEventDate.getTime() - brasiliaNow.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'today', label: 'Evento Hoje', color: 'text-warning-700', bgColor: 'bg-warning-100' };
    } else {
      return { status: 'upcoming', label: 'Evento Próximo', color: 'text-success-700', bgColor: 'bg-success-100' };
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = guest.qrCodeImage;
    link.download = `qrcode-${guest.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event.name,
        text: `Confira o evento: ${event.name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  // Componente de Contagem Regressiva para tema épico
  const CountdownTimer = ({ tipo = 'epic' }) => {
    const [timeLeft, setTimeLeft] = useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    });

    useEffect(() => {
      const calculateTimeLeft = () => {
        const eventDate = new Date(event.date);
        const now = new Date();
        const difference = eventDate - now;

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
          });
        }
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);

      return () => clearInterval(timer);
    }, [event.date]);

    if (tipo === 'minimal') {
      return (
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Contagem Regressiva</h3>
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
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold text-blue-700 mb-6">Contagem Regressiva</h3>
          <div className="flex justify-center space-x-4 md:space-x-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white text-3xl md:text-4xl font-bold rounded-lg px-4 py-2 min-w-[80px] shadow-lg">{timeLeft.days.toString().padStart(2, '0')}</div>
              <div className="text-blue-700 text-sm mt-2">Dias</div>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white text-3xl md:text-4xl font-bold rounded-lg px-4 py-2 min-w-[80px] shadow-lg">{timeLeft.hours.toString().padStart(2, '0')}</div>
              <div className="text-blue-700 text-sm mt-2">Horas</div>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white text-3xl md:text-4xl font-bold rounded-lg px-4 py-2 min-w-[80px] shadow-lg">{timeLeft.minutes.toString().padStart(2, '0')}</div>
              <div className="text-blue-700 text-sm mt-2">Min</div>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white text-3xl md:text-4xl font-bold rounded-lg px-4 py-2 min-w-[80px] shadow-lg">{timeLeft.seconds.toString().padStart(2, '0')}</div>
              <div className="text-blue-700 text-sm mt-2">Seg</div>
            </div>
          </div>
        </div>
      );
    }
    // NOVOS ESTILOS
    if (tipo === 'neon-circular') {
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
      <div className="text-center py-8">
        <h3 className="text-2xl font-bold text-white mb-6">Contagem Regressiva</h3>
        <div className="flex justify-center space-x-4 md:space-x-8">
          <div className="text-center">
            <div className="bg-red-600 text-white text-3xl md:text-4xl font-bold rounded-lg px-4 py-2 min-w-[80px]">{timeLeft.days.toString().padStart(2, '0')}</div>
            <div className="text-white text-sm mt-2">Dias</div>
          </div>
          <div className="text-center">
            <div className="bg-red-600 text-white text-3xl md:text-4xl font-bold rounded-lg px-4 py-2 min-w-[80px]">{timeLeft.hours.toString().padStart(2, '0')}</div>
            <div className="text-white text-sm mt-2">Horas</div>
          </div>
          <div className="text-center">
            <div className="bg-red-600 text-white text-3xl md:text-4xl font-bold rounded-lg px-4 py-2 min-w-[80px]">{timeLeft.minutes.toString().padStart(2, '0')}</div>
            <div className="text-white text-sm mt-2">Min</div>
          </div>
          <div className="text-center">
            <div className="bg-red-600 text-white text-3xl md:text-4xl font-bold rounded-lg px-4 py-2 min-w-[80px]">{timeLeft.seconds.toString().padStart(2, '0')}</div>
            <div className="text-white text-sm mt-2">Seg</div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Palestrantes para tema épico
  const PalestrantesSection = () => {
    // Garantir que palestrantes seja sempre um array
    const palestrantes = Array.isArray(pageConfig?.palestrantes) ? pageConfig.palestrantes : [];
    
    if (palestrantes.length === 0) {
      return null;
    }

    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzczNzM3Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI0Y5RjlGOSIvPgo8cGF0aCBkPSJNNDAgMTgwQzQwIDE2MCA2MCAxNDAgMTAwIDE0MEMxNDAgMTQwIDE2MCAxNjAgMTYwIDE4MEg0MFoiIGZpbGw9IiNGOUY5RjkiLz4KPC9zdmc+';

    // Estilos baseados no tema
    const getPalestrantesStyles = () => {
      switch (pageConfig?.tema) {
        case 'epic':
          return {
            container: 'py-16 px-4 bg-black text-white',
            title: 'text-4xl md:text-5xl font-bold text-center mb-12 text-white',
            subtitle: 'text-xl text-center mb-12 text-gray-300',
            grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8',
            card: 'bg-gray-900 rounded-xl overflow-hidden shadow-2xl hover:shadow-red-500/20 transition-all duration-300',
            image: 'w-full h-64 object-cover object-center',
            content: 'p-6',
            name: 'text-xl font-bold text-white mb-2',
            cargo: 'text-red-400 font-medium mb-3',
            descricao: 'text-gray-300 text-sm leading-relaxed'
          };
        case 'modern':
          return {
            container: 'py-16 px-4 bg-gradient-to-br from-gray-900 via-blue-900 to-red-900',
            title: 'text-4xl md:text-5xl font-bold text-center mb-12 text-white',
            subtitle: 'text-xl text-center mb-12 text-gray-300',
            grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
            card: 'bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl hover:shadow-blue-500/20 transition-all duration-300',
            image: 'w-full h-64 object-cover object-center',
            content: 'p-6',
            name: 'text-xl font-bold text-white mb-2',
            cargo: 'text-blue-300 font-medium mb-3',
            descricao: 'text-gray-200 text-sm leading-relaxed'
          };
        case 'classic':
          return {
            container: 'py-16 px-4 bg-gray-50',
            title: 'text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900',
            subtitle: 'text-lg text-center mb-12 text-gray-600',
            grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
            card: 'bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300',
            image: 'w-full h-64 object-cover object-center rounded-t-lg',
            content: 'p-6',
            name: 'text-xl font-bold text-gray-900 mb-2',
            cargo: 'text-blue-600 font-medium mb-3',
            descricao: 'text-gray-600 text-sm leading-relaxed'
          };
        case 'minimal':
          return {
            container: 'py-16 px-4 bg-white',
            title: 'text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900',
            subtitle: 'text-lg text-center mb-12 text-gray-600',
            grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
            card: 'border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-300',
            image: 'w-full h-64 object-cover object-center rounded-t-lg',
            content: 'p-6',
            name: 'text-xl font-bold text-gray-900 mb-2',
            cargo: 'text-gray-600 font-medium mb-3',
            descricao: 'text-gray-500 text-sm leading-relaxed'
          };
        default:
          return {
            container: 'py-16 px-4 bg-gray-50',
            title: 'text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900',
            subtitle: 'text-lg text-center mb-12 text-gray-600',
            grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
            card: 'bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300',
            image: 'w-full h-64 object-cover object-center rounded-t-lg',
            content: 'p-6',
            name: 'text-xl font-bold text-gray-900 mb-2',
            cargo: 'text-blue-600 font-medium mb-3',
            descricao: 'text-gray-600 text-sm leading-relaxed'
          };
      }
    };

    const styles = getPalestrantesStyles();

    return (
      <section className={styles.container}>
        <div className="max-w-7xl mx-auto">
          <h2 className={styles.title}>Palestrantes</h2>
          <p className={styles.subtitle}>
            Conheça os especialistas que irão compartilhar conhecimento neste evento
          </p>
          
          <div className={styles.grid}>
            {palestrantes.map((palestrante, index) => {
              return (
                <div key={index} className={styles.card}>
                  <div className="relative">
                    <img
                      src={palestrante.imagem ? getImageUrl(palestrante.imagem) : placeholderImage}
                      alt={palestrante.nome}
                      className={styles.image}
                      onError={(e) => {
                        console.error(`❌ Erro ao carregar imagem do palestrante ${index + 1}:`, e.target.src);
                        e.target.src = placeholderImage;
                      }}
                      onLoad={() => {
                        // Imagem carregada com sucesso
                      }}
                    />
                  </div>
                  <div className={styles.content}>
                    <h3 className={styles.name}>{palestrante.nome}</h3>
                    <p className={styles.cargo}>{palestrante.cargo}</p>
                    {palestrante.descricao && (
                      <p className={styles.descricao}>{palestrante.descricao}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const getLayoutClasses = () => {
    const tema = pageConfig?.tema || 'modern';
    switch (tema) {
      case 'epic':
        return {
          header: 'bg-gradient-to-br from-red-900 via-red-800 to-black text-white',
          main: 'bg-black',
          card: 'bg-gray-900',
          text: 'text-white',
          button: 'btn-gradient-epic',
          image: 'rounded-2xl shadow-2xl'
        };
      case 'modern-dark':
        return {
          header: 'bg-gradient-to-r from-black via-blue-900 to-red-900 text-white',
          main: 'bg-gray-900',
          card: 'bg-gray-800',
          text: 'text-white',
          button: 'btn-gradient-dark',
          image: 'rounded-2xl shadow-lg'
        };
      case 'modern':
        return {
          header: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
          main: 'bg-blue-50',
          card: 'bg-white',
          text: 'text-gray-900',
          button: 'btn-gradient-blue',
          image: 'rounded-2xl shadow-lg'
        };
      case 'classic':
        return {
          header: 'bg-gray-800 text-white',
          main: 'bg-gray-50',
          card: 'bg-white',
          text: 'text-gray-800',
          button: 'btn-primary',
          image: 'rounded-2xl shadow-lg'
        };
      case 'minimal':
        return {
          header: 'bg-white border-b border-gray-200',
          main: 'bg-white',
          card: 'bg-gray-50',
          text: 'text-gray-900',
          button: 'btn-primary',
          image: 'rounded-2xl shadow-lg'
        };
      default:
        return {
          header: 'header-bg text-white',
          main: 'bg-custom-background',
          card: 'card-bg',
          text: 'text-custom-text',
          button: 'btn-primary',
          image: 'rounded-2xl shadow-lg'
        };
    }
  };

  const layoutClasses = getLayoutClasses();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Página de evento não disponível
  if (eventNotAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Lock className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Evento Privado</h3>
          <p className="text-gray-600 mb-8">
            Este evento não está disponível publicamente no momento. 
            Isso pode acontecer por alguns motivos:
          </p>
          <div className="bg-white rounded-lg shadow-md p-6 text-left">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Possíveis motivos:</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                O evento está marcado como privado
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                O evento está inativo
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                O evento foi removido ou não existe
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Para acessar este evento, você precisa de permissão do organizador.
                Entre em contato com o organizador para mais informações.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="mx-auto h-16 w-16 text-red-500 mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Evento não encontrado</h3>
          <p className="text-gray-600 mb-8">{error}</p>
        </div>
      </div>
    );
  }

  const status = getEventStatus(event);

  // Landing page principal do evento
  // A página de sucesso é renderizada primeiro se a inscrição foi bem-sucedida
  if (registrationSuccess && guest) {
    const action = formConfig?.settings?.postSubmitAction || 'qr';
    if (action === 'message') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {formConfig?.settings?.customMessage || 'Inscrição realizada com sucesso!'}
              </h1>
            </div>
          </div>
        </div>
      );
    }
    if (action === 'redirect') {
      window.location.href = formConfig?.settings?.redirectUrl || '/';
      return null;
    }
    if (action === 'customText') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
              <div className="text-gray-900 text-lg mb-2" dangerouslySetInnerHTML={{__html: formConfig?.settings?.customText || 'Inscrição realizada!'}} />
            </div>
          </div>
        </div>
      );
    }
    // Padrão: QR code e mensagem
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Inscrição Confirmada!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Sua inscrição para <strong>{event.name}</strong> foi realizada com sucesso.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Dados da Inscrição</h2>
              <p className="text-gray-600">Guarde essas informações</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <p className="text-gray-900 font-medium">{guest.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{guest.email}</p>
              </div>
              {guest.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <p className="text-gray-900">{guest.phone}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Inscrição</label>
                <p className="text-gray-900 font-mono">{guest.id}</p>
              </div>
            </div>

            {guest.qrCodeImage && (
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Seu QR Code</h3>
                <div className="inline-block bg-white p-4 rounded-lg shadow-md">
                  <img
                    src={guest.qrCodeImage}
                    alt="QR Code"
                    className="w-32 h-32 mx-auto"
                  />
                </div>
                <div className="mt-4 space-x-4">
                  <button
                    onClick={downloadQRCode}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar QR Code
                  </button>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={shareEvent}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar Evento
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Um email de confirmação foi enviado para <strong>{guest.email}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se o formulário estiver sendo exibido, a página principal não é mostrada,
  // apenas o formulário em tela cheia (ou o card de inscrição na coluna lateral).
  // A lógica de exibição do formulário agora está dentro do layout principal.

  // Se for apenas formulário (URL contém /formulario), mostra apenas o formulário
  if (isFormOnly) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {pageConfig?.registration?.formTitle || formConfig?.settings?.title || 'Inscrição no Evento'}
              </h2>
              <p className="text-gray-600 mt-2">
                {pageConfig?.registration?.formDescription || formConfig?.settings?.description || 'Preencha os dados abaixo para se inscrever'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {formConfig?.fields?.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && '*'}
                  </label>
                  <input
                    id={field.id}
                    type={field.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={field.placeholder}
                    {...register(field.id, {
                      required: field.required ? `${field.label} é obrigatório` : false,
                    })}
                  />
                  {errors[field.id] && (
                    <p className="text-red-500 text-sm mt-1">{errors[field.id].message}</p>
                  )}
                </div>
              ))}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : (formConfig?.settings?.submitButtonText || 'Confirmar Inscrição')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      '--primary-color': pageConfig?.theme?.primaryColor || '#3B82F6',
      '--secondary-color': pageConfig?.theme?.secondaryColor || '#1E40AF',
      '--background-color': pageConfig?.theme?.backgroundColor || '#FFFFFF',
      '--text-color': pageConfig?.theme?.textColor || '#1F2937',
      '--button-color': pageConfig?.theme?.buttonColor || '#3B82F6',
    }} className="min-h-screen bg-gray-50">
      
      <style>
        {`
          .btn-primary {
            background-color: var(--button-color) !important;
            border-color: var(--button-color) !important;
          }
          .btn-primary:hover {
            background-color: ${pageConfig?.theme?.buttonColor ? 
              adjustBrightness(pageConfig.theme.buttonColor, -20) : '#2563EB'} !important;
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
          .btn-gradient-blue {
            background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
            color: #fff;
            border: none;
            transition: filter 0.2s;
          }
          .btn-gradient-blue:hover {
            filter: brightness(0.9);
          }
          .btn-gradient-dark {
            background: linear-gradient(90deg, #000 0%, #1E3A8A 60%, #991B1B 100%);
            color: #fff;
            border: none;
            transition: filter 0.2s;
          }
          .btn-gradient-dark:hover {
            filter: brightness(1.1);
          }
          .btn-gradient-epic {
            background: linear-gradient(90deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%);
            color: #fff;
            border: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
          }
          .btn-gradient-epic:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
          }
          .btn-gradient-epic-header {
            background: linear-gradient(90deg, #3B82F6 0%, #1D4ED8 50%, #1E40AF 100%);
            color: #fff;
            border: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            border-radius: 12px;
            font-weight: 600;
          }
          .btn-gradient-epic-header:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
          .btn-gradient-epic-submit {
            background: linear-gradient(90deg, #3B82F6 0%, #1D4ED8 50%, #1E40AF 100%);
            color: #fff;
            border: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            border-radius: 16px;
            font-weight: 600;
            padding: 16px 24px;
            font-size: 16px;
            min-height: 56px;
          }
          .btn-gradient-epic-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
          .prose-invert {
            color: #ffffff !important;
          }
          .prose-invert h1, .prose-invert h2, .prose-invert h3, .prose-invert h4, .prose-invert h5, .prose-invert h6 {
            color: #ffffff !important;
          }
          .prose-invert p {
            color: #ffffff !important;
          }
          .prose-invert strong {
            color: #ffffff !important;
          }
          .prose-invert em {
            color: #ffffff !important;
          }
          .prose-invert ul, .prose-invert ol {
            color: #ffffff !important;
          }
          .prose-invert li {
            color: #ffffff !important;
          }
          .prose-invert a {
            color: #60a5fa !important;
          }
          .prose-invert a:hover {
            color: #93c5fd !important;
          }
          @media (max-width: 768px) {
            header, main, .card, .rounded-2xl, .shadow-lg {
              border-radius: 1rem !important;
            }
          }
          .btn-gradient-blue-black {
            background: linear-gradient(90deg, #2563eb 0%, #000 100%);
            color: #fff;
            border: none;
            border-radius: 1rem;
            transition: filter 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(37,99,235,0.10);
            font-weight: 600;
          }
          .btn-gradient-blue-black:hover {
            filter: brightness(0.95);
            box-shadow: 0 4px 16px rgba(37,99,235,0.15);
          }
          .btn-gradient-dark-rounded {
            background: linear-gradient(90deg, #000 0%, #1E3A8A 60%, #991B1B 100%);
            color: #fff;
            border: none;
            border-radius: 1rem;
            transition: filter 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 16px 0 rgba(255,255,255,0.18), 0 0px 0px 1.5px rgba(255,255,255,0.25);
            font-weight: 600;
          }
          .btn-gradient-dark-rounded:hover {
            filter: brightness(1.05);
            box-shadow: 0 6px 32px 0 rgba(255,255,255,0.28), 0 0px 0px 2px rgba(255,255,255,0.35);
          }
        `}
      </style>
      
      {/* Novo Cabeçalho Moderno */}
      <header className={layoutClasses.header}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Para tema épico, exibir imagem em cima do contador */}
          {pageConfig?.tema === 'epic' && (
            <div className="flex justify-center py-8">
              {(() => {
                const imageUrl = pageConfig?.header?.imageUrl || event.imageUrl;
                return imageUrl ? (
                  <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      className="w-full h-64 object-cover"
                      src={getImageUrl(imageUrl)}
                      alt={event.name}
                      onError={(e) => {
                        console.error('❌ Erro ao carregar imagem:', e.target.src);
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('✅ Imagem carregada com sucesso:', getImageUrl(imageUrl));
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-2xl h-64 bg-gray-800 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-400 text-lg">Nenhuma imagem configurada</p>
                  </div>
                );
              })()}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12">
            {/* Coluna de Texto */}
            <div className="flex flex-col justify-center">
              <h1 className={`text-4xl md:text-5xl font-bold tracking-tight ${layoutClasses.text}`}>
                {pageConfig?.header?.title || event.name}
              </h1>
              {pageConfig?.header?.subtitle && (
                <p className="mt-4 text-xl text-gray-300">
                  {pageConfig.header.subtitle}
                </p>
              )}
              <div className="mt-6 space-y-4 text-lg text-gray-300">
                {pageConfig?.content?.showDate && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                )}
                {pageConfig?.content?.showLocation && event.location && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
              <div className="mt-8">
                {pageConfig?.registration?.showForm && event.isActive && event.isPublic && new Date(event.date) > new Date() && (
                   <button
                     onClick={() => {
                       setShowRegistration(true);
                       // Scroll para o formulário após um pequeno delay
                       setTimeout(() => {
                         document.getElementById('registration-form')?.scrollIntoView({ 
                           behavior: 'smooth', 
                           block: 'center' 
                         });
                       }, 100);
                     }}
                     className={`${pageConfig?.tema === 'epic' ? 'btn-gradient-epic-header' : pageConfig?.tema === 'modern' ? 'btn-gradient-blue-black' : pageConfig?.tema === 'modern-dark' ? 'btn-gradient-dark-rounded' : layoutClasses.button} px-8 py-4 text-xl font-bold w-full`}
                   >
                     {pageConfig.registration.buttonText || 'Inscrever-se Agora'}
                   </button>
                )}
                {pageConfig?.registration?.showForm && (!event.isActive || !event.isPublic || new Date(event.date) <= new Date()) && (
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${status?.bgColor || 'bg-gray-100'} ${status?.color || 'text-gray-600'}`}>
                    {status?.label || 'Inscrições Indisponíveis'}
                  </span>
                )}
                 {status && !pageConfig?.registration?.showForm && (
                   <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                    {status.label}
                  </span>
                )}
                {!pageConfig?.registration?.showForm && !status && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                    Evento Disponível
                  </span>
                )}
              </div>
            </div>

            {/* Coluna da Imagem - apenas para temas não épicos */}
            {pageConfig?.tema !== 'epic' && (
            <div className="flex items-center justify-center">
              {pageConfig?.header?.showImage && (pageConfig?.header?.imageUrl || event.imageUrl) && (
                <div className="w-full max-w-md rounded-lg overflow-hidden shadow-2xl">
                  <img
                      className={`w-full h-auto object-cover aspect-square ${layoutClasses.image}`}
                    src={getImageUrl(pageConfig.header.imageUrl || event.imageUrl)}
                    alt={event.name}
                    onError={(e) => {
                      console.error('❌ Erro ao carregar imagem:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            )}
          </div>
        </div>
        
        {/* Contagem Regressiva para tema épico */}
        {pageConfig?.countdownType !== 'none' && <CountdownTimer tipo={pageConfig?.countdownType || 'epic'} />}
      </header>

      {/* Conteúdo Principal (Descrição, Formulário, etc.) */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${layoutClasses.main}`}>
        {/* Seção de Palestrantes para todos os temas */}
        <PalestrantesSection />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Coluna da Descrição */}
          <div className="lg:col-span-2">
            {(() => {
              return null;
            })()}
            {pageConfig?.content?.showDescription && event.description && (
              <div className={`${layoutClasses.card} rounded-lg shadow-md p-8`}>
                <h2 className={`text-2xl font-bold ${layoutClasses.text} mb-4`}>Descrição do Evento</h2>
                <div 
                  className={`prose prose-lg max-w-none ${['epic','modern-dark','modern'].includes(pageConfig?.tema) ? 'prose-invert' : ''} ${layoutClasses.text}`}
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}
            {pageConfig?.content?.customText && (
               <div className={`${layoutClasses.card} rounded-lg shadow-md p-8 mt-8`}>
                <h2 className={`text-2xl font-bold ${layoutClasses.text} mb-4`}>Informações Adicionais</h2>
                <div 
                  className={`prose prose-lg max-w-none ${layoutClasses.text} ${pageConfig?.tema === 'epic' ? 'prose-invert' : ''}`}
                  dangerouslySetInnerHTML={{ __html: pageConfig.content.customText }}
                />
              </div>
            )}
          </div>

          {/* Coluna de Ingressos/Formulário */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {showRegistration ? (
                // Formulário de Inscrição
                 <div className={`${layoutClasses.card} rounded-lg shadow-md p-8${pageConfig?.tema === 'modern-dark' ? ' border border-white/30 shadow-[0_2px_16px_0_rgba(255,255,255,0.18),0_0px_0px_1.5px_rgba(255,255,255,0.25)]' : ''}`} id="registration-form">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-bold ${layoutClasses.text}`}>
                      {pageConfig.registration.formTitle || formConfig?.settings?.title || 'Inscrição'}
                    </h2>
                    <button onClick={() => setShowRegistration(false)} className="text-gray-500 hover:text-gray-800">
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                  <p className={`${layoutClasses.text} mb-6`}>
                    {pageConfig.registration.formDescription || formConfig?.settings?.description || 'Preencha para se inscrever.'}
                  </p>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {formConfig?.fields?.map((field) => (
                      <div key={field.id}>
                        <label htmlFor={field.id} className={`form-label ${layoutClasses.text}`}>{field.label} {field.required && '*'}</label>
                        <input
                          id={field.id}
                          type={field.type}
                          className="input"
                          placeholder={field.placeholder}
                          {...register(field.id, {
                            required: field.required ? `${field.label} é obrigatório` : false,
                          })}
                        />
                        {errors[field.id] && <p className="form-error">{errors[field.id].message}</p>}
                      </div>
                    ))}
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button 
                      type="submit" 
                      disabled={submitting} 
                      className={`${pageConfig?.tema === 'epic' ? 'btn-gradient-epic-submit' : pageConfig?.tema === 'modern' ? 'btn-gradient-blue-black' : pageConfig?.tema === 'modern-dark' ? 'btn-gradient-dark-rounded' : layoutClasses.button} w-full py-4 text-xl font-bold`}
                    >
                      {submitting ? 'Enviando...' : (formConfig?.settings?.submitButtonText || 'Confirmar Inscrição')}
                    </button>
                  </form>
                </div>
              ) : (
                // Card de "Ingressos"
                <div className={`${layoutClasses.card} rounded-lg shadow-md p-8`}>
                  <h2 className={`text-2xl font-bold ${layoutClasses.text} mb-6`}>{pageConfig?.registration?.cardTitle || 'Ingressos'}</h2>
                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                       <div>
                         <p className={`font-semibold ${layoutClasses.text}`}>Inscrição Geral</p>
                         <p className={`text-sm ${layoutClasses.text}`}>Acesso ao evento.</p>
                       </div>
                       {pageConfig?.registration?.showForm && event.isActive && event.isPublic && new Date(event.date) > new Date() ? (
                         <button 
                           onClick={() => {
                             setShowRegistration(true);
                             // Scroll para o formulário após um pequeno delay
                             setTimeout(() => {
                               document.getElementById('registration-form')?.scrollIntoView({ 
                                 behavior: 'smooth', 
                                 block: 'center' 
                               });
                             }, 100);
                           }} 
                           className={`${pageConfig?.tema === 'epic' ? 'btn-gradient-epic-header' : pageConfig?.tema === 'modern' ? 'btn-gradient-blue-black' : pageConfig?.tema === 'modern-dark' ? 'btn-gradient-dark-rounded' : layoutClasses.button} px-8 py-3`}
                         >
                           Inscrever-se
                         </button>
                       ) : (
                         <span className="text-sm font-semibold text-gray-500">
                           {!event.isActive ? 'Evento Inativo' : 
                            !event.isPublic ? 'Evento Privado' : 
                            new Date(event.date) <= new Date() ? 'Evento Finalizado' : 
                            'Indisponível'}
                         </span>
                       )}
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default PublicEvent; 