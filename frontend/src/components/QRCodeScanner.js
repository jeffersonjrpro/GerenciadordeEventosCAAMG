import React, { useState } from 'react';

const QRCodeScanner = ({ onScan }) => {
  const [qrCode, setQrCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (qrCode.trim()) {
      onScan(qrCode.trim());
      setQrCode('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Digite o QR Code do convidado ou escaneie
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value)}
          placeholder="Digite o QR Code aqui..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={!qrCode.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
        >
          Validar Acesso
        </button>
      </form>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          💡 Dica: Você pode copiar e colar o QR Code ou digitar manualmente
        </p>
      </div>
    </div>
  );
};

export default QRCodeScanner; 