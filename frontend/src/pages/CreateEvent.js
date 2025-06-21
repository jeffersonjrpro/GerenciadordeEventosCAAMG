import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Calendar, MapPin, Clock, FileText, Save, ArrowLeft } from 'lucide-react';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const isActive = watch('isActive');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Processar e adicionar apenas campos válidos
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
          if (key === 'isActive' || key === 'requiresConfirmation' || key === 'allowGuests') {
            formData.append(key, data[key] ? 'true' : 'false');
          } else if (key === 'maxGuests') {
            // Só adiciona se for um número válido
            const numValue = parseInt(data[key]);
            if (!isNaN(numValue) && numValue > 0) {
              formData.append(key, numValue.toString());
            }
          } else if (key !== 'image') { // Não adiciona o campo image aqui
            formData.append(key, data[key]);
          }
        }
      });

      // Adiciona a imagem se foi selecionada
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      console.log('Enviando dados:', Object.fromEntries(formData));

      const response = await api.post('/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Resposta do servidor:', response.data);
      navigate(`/events/${response.data.id}`);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      if (error.response && error.response.data) {
        console.error('Detalhes do erro:', error.response.data);
        if (error.response.data.details) {
          alert('Erro de validação: ' + error.response.data.details.map(d => d.msg).join(', '));
        } else {
          alert('Erro ao criar evento: ' + (error.response.data.message || error.response.data.error || error.message));
        }
      } else {
        alert('Erro ao criar evento: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/events')}
            className="btn-outline inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Criar Novo Evento</h1>
            <p className="mt-1 text-sm text-gray-500">
              Preencha as informações do seu evento
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
                  <label htmlFor="description" className="form-label">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    className="input"
                    placeholder="Descreva seu evento..."
                    {...register('description', {
                      maxLength: {
                        value: 1000,
                        message: 'Descrição deve ter no máximo 1000 caracteres',
                      },
                    })}
                  />
                  {errors.description && (
                    <p className="form-error">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="maxGuests" className="form-label">
                      Capacidade
                    </label>
                    <input
                      id="maxGuests"
                      type="number"
                      min="1"
                      className="input"
                      placeholder="Ex: 100"
                      {...register('maxGuests', {
                        min: {
                          value: 1,
                          message: 'Capacidade deve ser maior que 0',
                        },
                      })}
                    />
                    {errors.maxGuests && (
                      <p className="form-error">{errors.maxGuests.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="category" className="form-label">
                      Categoria
                    </label>
                    <select
                      id="category"
                      className="input"
                      {...register('category')}
                    >
                      <option value="">Selecione uma categoria</option>
                      <option value="business">Negócios</option>
                      <option value="technology">Tecnologia</option>
                      <option value="education">Educação</option>
                      <option value="entertainment">Entretenimento</option>
                      <option value="health">Saúde</option>
                      <option value="sports">Esportes</option>
                      <option value="other">Outros</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações Avançadas */}
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
                    <label htmlFor="requiresConfirmation" className="form-label">
                      Requer Confirmação
                    </label>
                    <p className="text-sm text-gray-500">
                      Convidados precisam confirmar presença
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register('requiresConfirmation')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="allowGuests" className="form-label">
                      Permitir Convidados
                    </label>
                    <p className="text-sm text-gray-500">
                      Convidados podem adicionar outros convidados
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register('allowGuests')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
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

            {/* Ações */}
            <div className="card">
              <div className="card-body">
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full inline-flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Criando...' : 'Criar Evento'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/events')}
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

export default CreateEvent; 