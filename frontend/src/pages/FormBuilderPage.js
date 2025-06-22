import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FormBuilder from '../components/FormBuilder';

const FormBuilderPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const handleSave = (config) => {
    console.log('Formulário salvo:', config);
    // Você pode adicionar lógica adicional aqui
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Evento
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Construtor de Formulário</h1>
          <p className="mt-2 text-gray-600">
            Crie e personalize o formulário de inscrição do seu evento
          </p>
        </div>

        {/* Form Builder */}
        <FormBuilder eventId={eventId} onSave={handleSave} />
      </div>
    </div>
  );
};

export default FormBuilderPage; 