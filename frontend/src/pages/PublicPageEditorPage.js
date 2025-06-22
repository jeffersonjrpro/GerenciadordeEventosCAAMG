import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PublicPageEditor from '../components/PublicPageEditor';

const PublicPageEditorPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const handleSave = (config) => {
    console.log('Página salva:', config);
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
          <h1 className="text-3xl font-bold text-gray-900">Editor da Página Pública</h1>
          <p className="mt-2 text-gray-600">
            Personalize a aparência da página pública do seu evento
          </p>
        </div>

        {/* Public Page Editor */}
        <PublicPageEditor eventId={eventId} onSave={handleSave} />
      </div>
    </div>
  );
};

export default PublicPageEditorPage; 