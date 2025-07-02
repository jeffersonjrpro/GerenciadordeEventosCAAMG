import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const FormPreview = ({ config, eventId }) => {
  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const totalSteps = config.fields.length;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }));
    }
  };

  const validateField = (field) => {
    if (field.required && (!formData[field.id] || formData[field.id].trim() === '')) {
      return `${field.label} é obrigatório`;
    }
    
    if (field.type === 'email' && formData[field.id]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData[field.id])) {
        return 'E-mail inválido';
      }
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    config.fields.forEach(field => {
      const error = validateField(field);
      if (error) {
        newErrors[field.id] = error;
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Simulate submission
    setSubmitted(true);
    
    // In a real implementation, you would submit to the API here
    console.log('Form data:', formData);
  };

  const renderField = (field) => {
    const baseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500";
    const errorClasses = errors[field.id] ? "border-red-500" : "border-gray-300";

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} ${errorClasses}`}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} ${errorClasses}`}
          />
        );
      case 'tel':
        return (
          <input
            type="tel"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} ${errorClasses}`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} ${errorClasses}`}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`${baseClasses} ${errorClasses}`}
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData[field.id] || false}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-gray-700">{field.placeholder || 'Opção'}</span>
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} ${errorClasses}`}
          />
        );
    }
  };

  if (submitted) {
    // Pós-inscrição customizada
    const action = config.settings.postSubmitAction || 'qr';
    if (action === 'message') {
      return (
        <div className="max-w-md mx-auto">
          <div className="card text-center">
            <div className="card-body">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {config.settings.customMessage || 'Inscrição realizada com sucesso!'}
              </h3>
            </div>
          </div>
        </div>
      );
    }
    if (action === 'redirect') {
      window.location.href = config.settings.redirectUrl || '/';
      return null;
    }
    if (action === 'customText') {
      return (
        <div className="max-w-md mx-auto">
          <div className="card text-center">
            <div className="card-body">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <div className="text-gray-900 text-lg mb-2" dangerouslySetInnerHTML={{__html: config.settings.customText || 'Inscrição realizada!'}} />
            </div>
          </div>
        </div>
      );
    }
    // Padrão: QR code e mensagem
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center">
          <div className="card-body">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {config.settings.successMessage}
            </h3>
            <p className="text-gray-600 mb-4">
              Sua inscrição foi registrada com sucesso!
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({});
                setCurrentStep(1);
                setErrors({});
              }}
              className="btn-primary"
            >
              Nova Inscrição
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header text-center">
          <h3 className="text-2xl font-bold text-gray-900">{config.settings.title}</h3>
          {config.settings.description && (
            <p className="mt-2 text-gray-600">{config.settings.description}</p>
          )}
        </div>
        
        <div className="card-body">
          {/* Progress Bar */}
          {config.settings.showProgressBar && totalSteps > 1 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {config.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {errors[field.id] && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors[field.id]}
                  </div>
                )}
              </div>
            ))}

            <button
              type="submit"
              className="w-full btn-primary py-3 text-lg"
            >
              {config.settings.submitButtonText}
            </button>
          </form>
        </div>
      </div>

      {/* Preview Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Esta é uma visualização do formulário. Os dados não serão salvos.
        </p>
      </div>
    </div>
  );
};

export default FormPreview; 