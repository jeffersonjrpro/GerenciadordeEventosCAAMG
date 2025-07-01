import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  QrCode,
  Download,
  Share2,
  Lock
} from 'lucide-react';

const PublicEvent = () => {
  const { eventId } = useParams();
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
  const isPreview = location.pathname.includes('/preview/event/');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      setEventNotAvailable(false);
      
      // Se for preview, usa a API de preview sem restrições
      const eventEndpoint = isPreview 
        ? `/public/events/${eventId}/preview`
        : `/public/events/${eventId}`;
      
      console.log('🔍 fetchEventDetails - eventEndpoint:', eventEndpoint);
      console.log('🔍 fetchEventDetails - isPreview:', isPreview);
      console.log('🔍 fetchEventDetails - eventId:', eventId);
      
      // Primeiro tenta carregar o evento
      const eventResponse = await api.get(eventEndpoint);
      console.log('✅ fetchEventDetails - evento carregado:', eventResponse.data);
      console.log('✅ fetchEventDetails - evento isActive:', eventResponse.data.data?.isActive);
      console.log('✅ fetchEventDetails - evento isPublic:', eventResponse.data.data?.isPublic);
      
      setEvent(eventResponse.data.data);
      
      // Verificação adicional: se não for preview, verificar se o evento está ativo e público
      if (!isPreview && (!eventResponse.data.data.isActive || !eventResponse.data.data.isPublic)) {
        console.log('⚠️ fetchEventDetails - evento não está ativo ou público');
        setEventNotAvailable(true);
        setError('Evento não está disponível publicamente');
        return;
      }
      
      // Depois tenta carregar a configuração do formulário
      try {
        const formEndpoint = isPreview 
          ? `/public/events/${eventId}/form-config/preview`
          : `/public/events/${eventId}/form-config`;
        
        const formResponse = await api.get(formEndpoint);
        console.log('✅ fetchEventDetails - form config carregado:', formResponse.data);
        setFormConfig(formResponse.data.data);
      } catch (formError) {
        console.warn('⚠️ fetchEventDetails - erro ao carregar form config:', formError);
        // Se não conseguir carregar a configuração do formulário, usa uma padrão
        setFormConfig({
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Nome Completo',
              required: true,
              placeholder: 'Digite seu nome completo',
              order: 1
            },
            {
              id: 'email',
              type: 'email',
              label: 'E-mail',
              required: true,
              placeholder: 'Digite seu e-mail',
              order: 2
            },
            {
              id: 'phone',
              type: 'tel',
              label: 'Telefone',
              required: false,
              placeholder: 'Digite seu telefone',
              order: 3
            }
          ],
          settings: {
            title: 'Inscrição no Evento',
            description: 'Preencha os dados abaixo para se inscrever',
            submitButtonText: 'Confirmar Inscrição',
            successMessage: 'Inscrição realizada com sucesso!',
            showProgressBar: true,
            allowMultipleSubmissions: false
          }
        });
      }

      // Carregar configuração da página pública
      try {
        const pageConfigEndpoint = isPreview 
          ? `/public/events/${eventId}/public-page-config/preview`
          : `/events/${eventId}/public-page-config`;
        
        const pageConfigResponse = await api.get(pageConfigEndpoint);
        console.log('✅ fetchEventDetails - page config carregado:', pageConfigResponse.data);
        console.log('🔍 fetchEventDetails - showImage:', pageConfigResponse.data.data?.header?.showImage);
        console.log('🔍 fetchEventDetails - imageUrl:', eventResponse.data.data.imageUrl);
        setPageConfig(pageConfigResponse.data.data);
      } catch (pageConfigError) {
        console.warn('⚠️ fetchEventDetails - erro ao carregar page config:', pageConfigError);
        // Se não conseguir carregar a configuração da página, usa uma padrão
        setPageConfig({
          layout: 'modern',
          theme: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937'
          },
          header: {
            title: eventResponse.data.data.name,
            subtitle: eventResponse.data.data.description || 'Um evento incrível está chegando!',
            showImage: true,
            imageUrl: eventResponse.data.data.imageUrl
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
            formDescription: 'Preencha os dados abaixo para participar do evento'
          },
          footer: {
            showSocialLinks: false,
            customText: '© 2024 Sistema de Eventos'
          }
        });
      }
    } catch (error) {
      console.error('❌ fetchEventDetails - erro ao carregar evento:', error);
      console.error('❌ fetchEventDetails - error.response:', error.response);
      console.error('❌ fetchEventDetails - error.message:', error.message);
      
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
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.post(`/public/events/${eventId}/guests/public`, data);
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
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    // Garantir que o caminho comece com /uploads/
    const normalizedPath = imageUrl.startsWith('/uploads/') ? imageUrl : `/uploads/${imageUrl}`;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${normalizedPath}`;
  };

  const getEventStatus = (event) => {
    if (!event) return null;
    
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (!event.isActive) {
      return { status: 'inactive', label: 'Evento Inativo', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    } else if (!event.isPublic) {
      return { status: 'private', label: 'Evento Privado', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    } else if (eventDate < now) {
      return { status: 'finished', label: 'Evento Finalizado', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
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
    }} className="min-h-screen bg-gray-50">
      
      {/* Novo Cabeçalho Moderno */}
      <header className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12">
            {/* Coluna de Texto */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
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
                     onClick={() => setShowRegistration(true)}
                     className="btn-primary px-8 py-3 text-lg font-medium"
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

            {/* Coluna da Imagem */}
            <div className="flex items-center justify-center">
              {pageConfig?.header?.showImage && (pageConfig?.header?.imageUrl || event.imageUrl) && (
                <div className="w-full max-w-md rounded-lg overflow-hidden shadow-2xl">
                  <img
                    className="w-full h-auto object-cover aspect-square"
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
          </div>
        </div>
      </header>

      {/* Conteúdo Principal (Descrição, Formulário, etc.) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Coluna da Descrição */}
          <div className="lg:col-span-2">
            {pageConfig?.content?.showDescription && event.description && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Descrição do Evento</h2>
                <div 
                  className="prose prose-lg max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}
            {pageConfig?.content?.customText && (
               <div className="bg-white rounded-lg shadow-md p-8 mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Informações Adicionais</h2>
                <div 
                  className="prose prose-lg max-w-none text-gray-700"
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
                 <div className="bg-white rounded-lg shadow-md p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {pageConfig.registration.formTitle || formConfig?.settings?.title || 'Inscrição'}
                    </h2>
                    <button onClick={() => setShowRegistration(false)} className="text-gray-500 hover:text-gray-800">
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {pageConfig.registration.formDescription || formConfig?.settings?.description || 'Preencha para se inscrever.'}
                  </p>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {formConfig?.fields?.map((field) => (
                      <div key={field.id}>
                        <label htmlFor={field.id} className="form-label">{field.label} {field.required && '*'}</label>
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
                    <button type="submit" disabled={submitting} className="btn-primary w-full">
                      {submitting ? 'Enviando...' : (formConfig?.settings?.submitButtonText || 'Confirmar Inscrição')}
                    </button>
                  </form>
                </div>
              ) : (
                // Card de "Ingressos"
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">{pageConfig?.registration?.cardTitle || 'Ingressos'}</h2>
                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                       <div>
                         <p className="font-semibold">Inscrição Geral</p>
                         <p className="text-sm text-gray-500">Acesso ao evento.</p>
                       </div>
                       {pageConfig?.registration?.showForm && event.isActive && event.isPublic && new Date(event.date) > new Date() ? (
                         <button onClick={() => setShowRegistration(true)} className="btn-primary">
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