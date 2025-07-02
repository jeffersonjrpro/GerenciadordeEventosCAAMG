import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import api from '../services/api';
import { Calendar, MapPin, Clock, FileText, Save, ArrowLeft } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const EditEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [event, setEvent] = useState(null);
  const [quillError, setQuillError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    control
  } = useForm();

  const isActive = watch('isActive');

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}`);
      const eventData = response.data.data;
      setEvent(eventData);
      
      // Formata a data para o input datetime-local
      const eventDate = new Date(eventData.date);
      const formattedDate = eventDate.toISOString().slice(0, 16);
      
      reset({
        name: eventData.name,
        description: eventData.description || '',
        date: formattedDate,
        location: eventData.location,
        capacity: eventData.maxGuests || '',
        customSlug: eventData.customSlug || '',
        isActive: eventData.isActive,
        isPublic: eventData.isPublic
      });

      if (eventData.imageUrl) {
        setImagePreview(eventData.imageUrl);
      }
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Adiciona os campos do formulário
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          if (key === 'isActive' || key === 'isPublic') {
            formData.append(key, data[key] ? 'true' : 'false');
          } else if (key === 'capacity') {
            // Mapeia capacity para maxGuests
            formData.append('maxGuests', data[key]);
          } else if (key === 'description') {
            // Evita que descrições vazias (<p><br></p>) sejam salvas como nulas
            formData.append('description', data[key] === '<p><br></p>' ? '' : data[key]);
          } else if (key === 'customSlug') {
            // Adiciona customSlug se não estiver vazio
            if (data[key].trim()) {
              formData.append('customSlug', data[key].trim());
            }
          } else if (key !== 'image') { // Não adiciona o campo image aqui
            formData.append(key, data[key]);
          }
        }
      });

      // Adiciona o arquivo de imagem se foi selecionado
      const imageFile = data.image?.[0];
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await api.put(`/events/${eventId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Recarregar os dados do evento para mostrar a nova imagem
      await fetchEventDetails();
      
      // Mostrar mensagem de sucesso
      alert('Evento atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      alert('Erro ao atualizar evento. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // Se não há arquivo selecionado, mostrar a imagem atual do evento
      setImagePreview(event?.imageUrl || null);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Evento não encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          O evento que você está tentando editar não existe.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/events')}
            className="btn-primary"
          >
            Voltar aos Eventos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="btn-outline inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Evento</h1>
            <p className="mt-1 text-sm text-gray-500">
              Atualize as informações do seu evento
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label htmlFor="name" className="form-label">
                    Nome do Evento *
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="input"
                    placeholder="Ex: Conferência de Tecnologia 2024"
                    {...register('name', {
                      required: 'Nome do evento é obrigatório',
                      minLength: {
                        value: 3,
                        message: 'Nome deve ter pelo menos 3 caracteres',
                      },
                    })}
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="customSlug" className="form-label">
                    URL Personalizada
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">seu-dominio.com/event/</span>
                    <input
                      id="customSlug"
                      type="text"
                      className="input flex-1"
                      placeholder="conferencia-tecnologia-2024"
                      {...register('customSlug', {
                        pattern: {
                          value: /^[a-z0-9-]+$/,
                          message: 'Apenas letras minúsculas, números e hífens são permitidos'
                        },
                        minLength: {
                          value: 3,
                          message: 'URL deve ter pelo menos 3 caracteres',
                        },
                        maxLength: {
                          value: 50,
                          message: 'URL deve ter no máximo 50 caracteres',
                        },
                      })}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe em branco para gerar automaticamente baseado no nome do evento
                  </p>
                  {errors.customSlug && (
                    <p className="form-error">{errors.customSlug.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="form-label">
                    Descrição
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <div className="min-h-[400px]">
                        {!quillError ? (
                          <div className="react-quill-wrapper">
                            <ReactQuill
                              theme="snow"
                              value={field.value}
                              onChange={field.onChange}
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
                            {...field}
                            rows={15}
                            className="input w-full"
                            placeholder="Descreva seu evento de forma detalhada..."
                          />
                        )}
                      </div>
                    )}
                  />
                  {errors.description && (
                    <p className="form-error">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Imagem do Evento */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Imagem do Evento</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                              Nenhuma imagem selecionada
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="input"
                    {...register('image')}
                  />
                </div>
              </div>
            </div>

            {/* Detalhes do Evento */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Detalhes do Evento</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label htmlFor="date" className="form-label">
                    Data e Hora *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="date"
                      type="datetime-local"
                      className="input pl-10"
                      {...register('date', {
                        required: 'Data e hora são obrigatórias',
                      })}
                    />
                  </div>
                  {errors.date && (
                    <p className="form-error">{errors.date.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="form-label">
                    Local *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="location"
                      type="text"
                      className="input pl-10"
                      placeholder="Ex: Centro de Convenções"
                      {...register('location', {
                        required: 'Local é obrigatório',
                      })}
                    />
                  </div>
                  {errors.location && (
                    <p className="form-error">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="capacity" className="form-label">
                    Capacidade
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    min="1"
                    className="input"
                    placeholder="Ex: 100"
                    {...register('capacity', {
                      min: {
                        value: 1,
                        message: 'Capacidade deve ser maior que 0',
                      },
                    })}
                  />
                  {errors.capacity && (
                    <p className="form-error">{errors.capacity.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Configurações</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="isActive" className="form-label">
                      Evento Ativo
                    </label>
                    <p className="text-sm text-gray-500">
                      Eventos inativos não aparecem para convidados
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register('isActive')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="isPublic" className="form-label">
                      Evento Público
                    </label>
                    <p className="text-sm text-gray-500">
                      Eventos públicos podem ser acessados por qualquer pessoa
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register('isPublic')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="card">
              <div className="card-body">
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary w-full inline-flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${eventId}`)}
                    className="btn-outline w-full"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditEvent; 