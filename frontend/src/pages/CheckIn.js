import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';

const CheckIn = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInResult, setCheckInResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEventDetails();
    return () => {
      stopCamera();
    };
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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Aqui você pode integrar com uma biblioteca de QR Code como jsQR
      // Por enquanto, vamos simular a detecção
      detectQRCode(imageData);
    }

    if (isScanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const detectQRCode = async (imageData) => {
    // Esta é uma implementação simulada
    // Em produção, você deve usar uma biblioteca como jsQR
    try {
      // Simular detecção de QR Code
      const qrData = "guest_123"; // Dados simulados do QR Code
      
      if (qrData) {
        await handleCheckIn(qrData);
      }
    } catch (error) {
      console.error('Erro ao processar QR Code:', error);
    }
  };

  const handleCheckIn = async (guestId) => {
    try {
      stopCamera();
      setLoading(true);
      
      const response = await api.post(`/events/${eventId}/checkin`, {
        guestId: guestId
      });

      setCheckInResult(response.data.data);
      setShowResult(true);
    } catch (error) {
      console.error('Erro no check-in:', error);
      setCheckInResult({
        success: false,
        message: error.response?.data?.message || 'Erro ao realizar check-in'
      });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (guestId) => {
    try {
      setLoading(true);
      
      const response = await api.post(`/events/${eventId}/checkin`, {
        guestId: guestId
      });

      setCheckInResult(response.data.data);
      setShowResult(true);
    } catch (error) {
      console.error('Erro no check-in manual:', error);
      setCheckInResult({
        success: false,
        message: error.response?.data?.message || 'Erro ao realizar check-in'
      });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const resetCheckIn = () => {
    setCheckInResult(null);
    setShowResult(false);
    setError(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !isScanning) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-danger-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Erro</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Check-in</h1>
            <p className="mt-1 text-sm text-gray-500">
              {event?.name} • {formatDate(event?.date)}
            </p>
          </div>
        </div>
      </div>

      {/* Check-in Result */}
      {showResult && checkInResult && (
        <div className="card">
          <div className="card-body text-center">
            {checkInResult.success ? (
              <div className="space-y-4">
                <CheckCircle className="mx-auto h-16 w-16 text-success-600" />
                <h3 className="text-lg font-medium text-gray-900">Check-in Realizado!</h3>
                <p className="text-sm text-gray-500">
                  {checkInResult.guest?.name} foi registrado(a) com sucesso.
                </p>
                {checkInResult.guest?.plusOne && (
                  <p className="text-sm text-gray-500">
                    Acompanhante: {checkInResult.guest.plusOne}
                  </p>
                )}
                <p className="text-sm text-gray-400">
                  {new Date().toLocaleTimeString('pt-BR')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <XCircle className="mx-auto h-16 w-16 text-danger-600" />
                <h3 className="text-lg font-medium text-gray-900">Erro no Check-in</h3>
                <p className="text-sm text-gray-500">{checkInResult.message}</p>
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={resetCheckIn}
                className="btn-primary"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner */}
      {!showResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Scanner QR Code</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {!isScanning ? (
                  <div className="text-center py-12">
                    <QrCode className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Iniciar Scanner
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Clique no botão abaixo para iniciar a leitura do QR Code
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={startCamera}
                        className="btn-primary inline-flex items-center"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Iniciar Câmera
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 object-cover rounded-lg border"
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                      <div className="absolute inset-0 border-2 border-primary-500 border-dashed rounded-lg pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-32 h-32 border-2 border-primary-500 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Posicione o QR Code dentro da área destacada
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={stopCamera}
                        className="btn-outline inline-flex items-center"
                      >
                        <CameraOff className="h-4 w-4 mr-2" />
                        Parar Câmera
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-danger-400" />
                      <div className="ml-3">
                        <p className="text-sm text-danger-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Check-in */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Check-in Manual</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Se o QR Code não estiver funcionando, você pode fazer o check-in manualmente.
                </p>
                
                <div>
                  <label className="form-label">ID do Convidado</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Digite o ID do convidado"
                    id="manualGuestId"
                  />
                </div>

                <button
                  onClick={() => {
                    const guestId = document.getElementById('manualGuestId').value;
                    if (guestId) {
                      handleManualCheckIn(guestId);
                    }
                  }}
                  className="btn-primary w-full"
                >
                  Fazer Check-in Manual
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Info */}
      {event && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Informações do Evento</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Data e Hora</p>
                  <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Convidados</p>
                  <p className="text-sm text-gray-500">
                    {event._count.guests} total • {event._count.checkIns} presentes
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <QrCode className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p className="text-sm text-gray-500">
                    {event.isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIn; 