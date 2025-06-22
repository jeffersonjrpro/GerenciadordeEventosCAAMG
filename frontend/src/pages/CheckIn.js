import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertCircle,
  Ticket
} from 'lucide-react';
import { QrReader } from 'react-qr-reader';

const CheckIn = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInResult, setCheckInResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      setError('Evento não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleScanResult = async (result) => {
    if (result && !isSubmitting) {
      setIsScanning(false);
      await handleCheckIn(result.text);
    }
  };

  const handleCheckIn = async (guestId) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setCheckInResult(null);
    setError(null);

    try {
      const response = await api.post(`/events/${eventId}/checkin`, { guestId });
      setCheckInResult({ ...response.data, success: true });
      setShowResult(true);
    } catch (error) {
      console.error('Erro no check-in:', error);
      setCheckInResult({
        success: false,
        message: error.response?.data?.message || 'Erro ao realizar check-in'
      });
      setShowResult(true);
    } finally {
      setIsSubmitting(false);
      setManualCode('');
    }
  };

  const handleManualFormSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCheckIn(manualCode.trim());
    }
  };

  const resetCheckIn = () => {
    setCheckInResult(null);
    setShowResult(false);
    setError(null);
    // Se a câmera estava ligada, reativa
    if (!isScanning && document.querySelector('.qr-reader-container')) {
      setIsScanning(true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !showResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !event && !showResult) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-danger-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Erro</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button onClick={() => navigate('/events')} className="btn-primary">
            Voltar aos Eventos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/events/${eventId}`)} className="btn-outline inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Check-in</h1>
            <p className="mt-1 text-sm text-gray-500">
              {event?.name} • {formatDate(event?.date)}
            </p>
          </div>
        </div>
      </div>

      {showResult && checkInResult ? (
        <div className="card">
          <div className="card-body text-center p-8">
            {checkInResult.success ? (
              <div className="space-y-4">
                <CheckCircle className="mx-auto h-20 w-20 text-success-600" />
                <h3 className="text-2xl font-bold text-gray-900">Check-in Realizado!</h3>
                <div className="text-lg text-gray-600 space-y-1">
                  <p><span className="font-semibold">Participante:</span> {checkInResult.data.guest.name}</p>
                  <p><span className="font-semibold">Código:</span> <span className="font-mono">{checkInResult.data.guest.qrCode}</span></p>
                </div>
                <p className="text-md text-gray-500 pt-2">
                  Registrado às {new Date(checkInResult.data.checkedInAt).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <XCircle className="mx-auto h-20 w-20 text-danger-600" />
                <h3 className="text-2xl font-bold text-gray-900">Erro no Check-in</h3>
                <p className="text-lg text-gray-600">{checkInResult.message}</p>
              </div>
            )}
            <div className="mt-8">
              <button onClick={resetCheckIn} className="btn-primary w-full max-w-xs mx-auto">
                Novo Check-in
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x md:divide-gray-200">
              <div className="space-y-4 md:pr-8">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Ticket className="h-6 w-6 mr-3 text-primary-600" />
                  Check-in por Código
                </h3>
                <p className="text-sm text-gray-500">
                  Digite o código único do participante para registrar a entrada.
                </p>
                <form onSubmit={handleManualFormSubmit} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="input w-full"
                    placeholder="Código do participante"
                    disabled={isSubmitting}
                  />
                  <button type="submit" className="btn-primary" disabled={isSubmitting || !manualCode.trim()}>
                    {isSubmitting ? 'Verificando...' : 'Verificar'}
                  </button>
                </form>
              </div>

              <div className="space-y-4 md:pl-8">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <QrCode className="h-6 w-6 mr-3 text-primary-600" />
                  Escanear QR Code
                </h3>
                {isScanning ? (
                  <div>
                    <div className="w-full max-w-sm mx-auto bg-gray-900 rounded-lg overflow-hidden border-4 border-gray-300 shadow-lg">
                      <QrReader
                        onResult={handleScanResult}
                        constraints={{ facingMode: 'environment' }}
                        className="qr-reader-container"
                        videoContainerStyle={{ paddingTop: 0 }}
                      />
                    </div>
                    <button onClick={() => setIsScanning(false)} className="btn-outline w-full mt-4 inline-flex items-center justify-center">
                      <CameraOff className="h-5 w-5 mr-2" />
                      Parar Câmera
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-500 mb-4">
                      Clique no botão para ativar a câmera e escanear o QR Code.
                    </p>
                    <button onClick={() => setIsScanning(true)} className="btn-primary inline-flex items-center justify-center">
                      <Camera className="h-5 w-5 mr-2" />
                      Ativar Câmera
                    </button>
                  </div>
                )}
                {error && <p className="form-error text-center mt-2">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIn; 