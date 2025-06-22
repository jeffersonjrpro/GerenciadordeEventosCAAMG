import React from 'react';
import { HexColorPicker } from 'react-colorful';

const FormSettings = ({ settings, onUpdate, eventId }) => {
  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Configurações do Formulário</h3>
        </div>
        <div className="card-body space-y-6">
          {/* Título e Descrição */}
          <div className="space-y-4">
            <div>
              <label className="form-label">Título do Formulário</label>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="input"
                placeholder="Ex: Inscrição no Evento"
              />
            </div>
            <div>
              <label className="form-label">Descrição</label>
              <textarea
                value={settings.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="input"
                placeholder="Ex: Preencha os dados abaixo para se inscrever"
              />
            </div>
          </div>

          {/* Botão de Envio */}
          <div>
            <label className="form-label">Texto do Botão de Envio</label>
            <input
              type="text"
              value={settings.submitButtonText}
              onChange={(e) => handleChange('submitButtonText', e.target.value)}
              className="input"
              placeholder="Ex: Confirmar Inscrição"
            />
          </div>

          {/* Mensagem de Sucesso */}
          <div>
            <label className="form-label">Mensagem de Sucesso</label>
            <textarea
              value={settings.successMessage}
              onChange={(e) => handleChange('successMessage', e.target.value)}
              rows={2}
              className="input"
              placeholder="Ex: Inscrição realizada com sucesso!"
            />
          </div>

          {/* Opções */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Opções</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="form-label">Mostrar Barra de Progresso</label>
                <p className="text-sm text-gray-500">Exibe uma barra de progresso durante o preenchimento</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showProgressBar}
                  onChange={(e) => handleChange('showProgressBar', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="form-label">Permitir Múltiplas Inscrições</label>
                <p className="text-sm text-gray-500">Permite que o mesmo e-mail se inscreva múltiplas vezes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowMultipleSubmissions}
                  onChange={(e) => handleChange('allowMultipleSubmissions', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* Código de Incorporação */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Código de Incorporação</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Use este código para incorporar o formulário em outros sites:
              </p>
              <div className="bg-white p-3 rounded border font-mono text-sm">
                {eventId ? `<iframe src="${window.location.origin}/event/${eventId}/formulario" width="100%" height="600" frameborder="0" style="border: none;"></iframe>` : ''}
              </div>
              <button
                onClick={() => {
                  if (eventId) {
                    navigator.clipboard.writeText(`<iframe src="${window.location.origin}/event/${eventId}/formulario" width="100%" height="600" frameborder="0" style="border: none;"></iframe>`);
                    alert('Código copiado!');
                  }
                }}
                className="btn-outline mt-3"
              >
                Copiar Código
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSettings; 