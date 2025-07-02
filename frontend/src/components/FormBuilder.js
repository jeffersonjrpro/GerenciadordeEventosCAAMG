import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Eye, 
  Copy, 
  Save,
  GripVertical,
  Type,
  Mail,
  Phone,
  Calendar,
  Hash,
  Text,
  CheckSquare
} from 'lucide-react';
import FormField from './FormField';
import FormSettings from './FormSettings';
import FormPreview from './FormPreview';

const FormBuilder = ({ eventId, onSave }) => {
  const [config, setConfig] = useState({
    fields: [],
    settings: {
      title: 'Inscrição no Evento',
      description: 'Preencha os dados abaixo para se inscrever',
      submitButtonText: 'Confirmar Inscrição',
      successMessage: 'Inscrição realizada com sucesso!',
      showProgressBar: true,
      allowMultipleSubmissions: false
    }
  });
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadFormConfig();
  }, [eventId]);

  const loadFormConfig = async () => {
    try {
      console.log('🔍 FormBuilder loadFormConfig - Iniciando carregamento');
      console.log('🔍 FormBuilder loadFormConfig - eventId:', eventId);
      
      const response = await fetch(`/api/events/${eventId}/form-config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('🔍 FormBuilder loadFormConfig - response status:', response.status);
      console.log('🔍 FormBuilder loadFormConfig - response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ FormBuilder loadFormConfig - dados recebidos:', JSON.stringify(data, null, 2));
        setConfig(data.data);
        console.log('✅ FormBuilder loadFormConfig - config atualizado no state');
      } else {
        const errorData = await response.text();
        console.error('❌ FormBuilder loadFormConfig - erro na resposta:', errorData);
      }
    } catch (error) {
      console.error('❌ FormBuilder loadFormConfig - erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setConfig(prev => ({
        ...prev,
        fields: arrayMove(prev.fields, 
          prev.fields.findIndex(field => field.id === active.id),
          prev.fields.findIndex(field => field.id === over.id)
        )
      }));
    }
  };

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: getDefaultLabel(type),
      required: false,
      placeholder: getDefaultPlaceholder(type),
      order: config.fields.length + 1
    };

    setConfig(prev => {
      const updatedFields = [...prev.fields, newField];
      return { ...prev, fields: updatedFields };
    });
    setTimeout(() => {
      setSelectedFieldId(newField.id);
    }, 0);
  };

  const updateField = (fieldId, updates) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field => {
        if (field.id === fieldId) {
          if (updates.type && updates.type !== field.type) {
            return {
              ...field,
              ...updates,
              placeholder: getDefaultPlaceholder(updates.type),
              label: getDefaultLabel(updates.type)
            };
          }
          return { ...field, ...updates };
        }
        return field;
      })
    }));
  };

  const removeField = (fieldId) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    setSelectedFieldId(null);
  };

  const updateSettings = (settings) => {
    setConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  };

  const getDefaultLabel = (type) => {
    const labels = {
      text: 'Campo de Texto',
      email: 'E-mail',
      tel: 'Telefone',
      number: 'Número',
      date: 'Data',
      checkbox: 'Checkbox'
    };
    return labels[type] || 'Campo';
  };

  const getDefaultPlaceholder = (type) => {
    const placeholders = {
      text: 'Digite aqui...',
      email: 'Digite seu e-mail',
      tel: 'Digite seu telefone',
      number: 'Digite um número',
      date: 'Selecione uma data',
      checkbox: ''
    };
    return placeholders[type] || 'Digite aqui...';
  };

  const handleSave = async () => {
    try {
      console.log('🔍 FormBuilder handleSave - Iniciando salvamento');
      console.log('🔍 FormBuilder handleSave - eventId:', eventId);
      console.log('🔍 FormBuilder handleSave - config:', JSON.stringify(config, null, 2));
      
      const response = await fetch(`/api/events/${eventId}/form-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      console.log('🔍 FormBuilder handleSave - response status:', response.status);
      console.log('🔍 FormBuilder handleSave - response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ FormBuilder handleSave - resposta:', data);
        if (onSave) onSave(config);
        alert('Formulário salvo com sucesso!');
      } else {
        const errorData = await response.text();
        console.error('❌ FormBuilder handleSave - erro na resposta:', errorData);
        alert(`Erro ao salvar formulário: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('❌ FormBuilder handleSave - erro:', error);
      alert('Erro ao salvar formulário');
    }
  };

  const generateEmbedCode = () => {
    const embedUrl = `${window.location.origin}/event/${eventId}/formulario`;
    return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border: none;"></iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    alert('Código de incorporação copiado!');
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
            Salvar Formulário
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('builder')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'builder'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Construtor
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Configurações
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
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Toolbox */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Campos Disponíveis</h3>
              </div>
              <div className="card-body space-y-3">
                <button
                  onClick={() => addField('text')}
                  className="w-full btn-outline text-left"
                >
                  <Text className="h-4 w-4 inline mr-2" />
                  Campo de Texto
                </button>
                <button
                  onClick={() => addField('email')}
                  className="w-full btn-outline text-left"
                >
                  <Mail className="h-4 w-4 inline mr-2" />
                  E-mail
                </button>
                <button
                  onClick={() => addField('tel')}
                  className="w-full btn-outline text-left"
                >
                  <Phone className="h-4 w-4 inline mr-2" />
                  Telefone
                </button>
                <button
                  onClick={() => addField('number')}
                  className="w-full btn-outline text-left"
                >
                  <Hash className="h-4 w-4 inline mr-2" />
                  Número
                </button>
                <button
                  onClick={() => addField('date')}
                  className="w-full btn-outline text-left"
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Data
                </button>
                <button
                  onClick={() => addField('checkbox')}
                  className="w-full btn-outline text-left"
                >
                  <CheckSquare className="h-4 w-4 inline mr-2" />
                  Checkbox
                </button>
              </div>
            </div>
          </div>

          {/* Form Builder */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Formulário</h3>
                <p className="text-sm text-gray-500">Arraste os campos para reordenar</p>
              </div>
              <div className="card-body">
                {config.fields.length === 0 ? (
                  <div className="text-center py-12">
                    <Type className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum campo adicionado</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Adicione campos do painel lateral para começar
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                  >
                    <SortableContext
                      items={config.fields.map(field => field.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {config.fields.map((field) => (
                          <FormField
                            key={field.id}
                            field={field}
                            isSelected={selectedFieldId === field.id}
                            onSelect={() => setSelectedFieldId(field.id)}
                            onUpdate={(updates) => updateField(field.id, updates)}
                            onRemove={() => removeField(field.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>

          {/* Field Properties */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Propriedades</h3>
              </div>
              <div className="card-body">
                {(() => {
                  const selectedField = config.fields.find(f => f.id === selectedFieldId);
                  if (selectedField) {
                    return (
                      <div className="space-y-4">
                        <div>
                          <label className="form-label">Rótulo</label>
                          <input
                            type="text"
                            value={selectedField.label}
                            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="form-label">Placeholder</label>
                          <input
                            type="text"
                            value={selectedField.placeholder}
                            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedField.required}
                              onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                              className="mr-2"
                            />
                            Campo obrigatório
                          </label>
                        </div>
                        <button
                          onClick={() => removeField(selectedField.id)}
                          className="btn-danger w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover Campo
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div className="text-center py-8">
                      <Type className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Selecione um campo para editar suas propriedades</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <FormSettings
          settings={config.settings}
          onUpdate={updateSettings}
          eventId={eventId}
        />
      )}

      {activeTab === 'preview' && (
        <FormPreview
          config={config}
          eventId={eventId}
        />
      )}
    </div>
  );
};

export default FormBuilder; 