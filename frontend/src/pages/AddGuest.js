import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  QrCode as QrCodeIcon,
} from 'lucide-react';

const AddGuest = () => {
  const { eventId, guestId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [guest, setGuest] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', confirmed: false, customFields: {} });

  useEffect(() => {
    fetchEvent();
    if (guestId) {
      fetchGuest();
    } else {
      setLoading(false);
    }
  }, [eventId, guestId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data.data);
    } catch (err) {
      setError('Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/guests/events/${eventId}/guests/${guestId}/details`);
      const g = response.data.data;
      setGuest(g);
      setForm({
        name: g.name || '',
        email: g.email || '',
        phone: g.phone || '',
        confirmed: g.confirmed || false,
        customFields: g.customFields || {},
      });
    } catch (err) {
      setError('Erro ao carregar convidado');
    } finally {
      setLoading(false);
    }
  };

  const getCustomFields = () => {
    if (event?.formConfig?.fields) {
      return event.formConfig.fields.filter(field =>
        field.id !== 'name' && field.id !== 'email' && field.id !== 'phone'
      );
    }
    if (event?.customFields) {
      return Object.entries(event.customFields).map(([id, value]) => ({
        id,
        label: id,
        type: value.type || 'text',
        required: value.required || false
      }));
    }
    return [];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('custom_')) {
      setForm(f => ({ ...f, customFields: { ...f.customFields, [name.replace('custom_', '')]: value } }));
    } else if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: checked }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        confirmed: form.confirmed,
        customFields: form.customFields,
      };
      let response;
      if (guestId) {
        response = await api.put(`/guests/events/${eventId}/guests/${guestId}`, payload);
      } else {
        response = await api.post(`/guests/events/${eventId}/guests`, payload);
      }
      setGuest(response.data.data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar convidado');
    } finally {
      setSaving(false);
    }
  };

  const downloadQRCode = () => {
    if (!guest?.qrCodeImage) return;
    const link = document.createElement('a');
    link.href = guest.qrCodeImage;
    link.download = `qrcode-${guest.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (success && guest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(`/events/${eventId}/guests`)} className="btn-outline inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{guestId ? 'Convidado Atualizado' : 'Convidado Adicionado'}</h1>
              <p className="mt-1 text-sm text-gray-500">{event?.name} • {guest.name}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card">
              <div className="card-header"><h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2></div>
              <div className="card-body space-y-4">
                <div className="flex items-center"><User className="h-5 w-5 mr-3 text-primary-600" /><div><p className="text-sm font-medium text-gray-500">Nome</p><p className="text-lg text-gray-900">{guest.name}</p></div></div>
                {guest.email && (<div className="flex items-center"><Mail className="h-5 w-5 mr-3 text-primary-600" /><div><p className="text-sm font-medium text-gray-500">E-mail</p><p className="text-lg text-gray-900">{guest.email}</p></div></div>)}
                {guest.phone && (<div className="flex items-center"><Phone className="h-5 w-5 mr-3 text-primary-600" /><div><p className="text-sm font-medium text-gray-500">Telefone</p><p className="text-lg text-gray-900">{guest.phone}</p></div></div>)}
                <div className="flex items-center"><Clock className="h-5 w-5 mr-3 text-primary-600" /><div><p className="text-sm font-medium text-gray-500">Inscrito em</p><p className="text-lg text-gray-900">{new Date(guest.createdAt).toLocaleString('pt-BR')}</p></div></div>
              </div>
            </div>
            {guest.customFields && Object.keys(guest.customFields).length > 0 && (
              <div className="card">
                <div className="card-header"><h2 className="text-xl font-semibold text-gray-900">Informações Adicionais</h2></div>
                <div className="card-body space-y-4">
                  {getCustomFields().map(field => (
                    <div key={field.id} className="flex items-center"><div className="h-5 w-5 mr-3 text-primary-600 flex items-center justify-center"><span className="text-xs font-bold">{field.label.charAt(0)}</span></div><div><p className="text-sm font-medium text-gray-500">{field.label}</p><p className="text-lg text-gray-900">{guest.customFields[field.id] || '-'}</p></div></div>
                  ))}
                </div>
              </div>
            )}
            <div className="card">
              <div className="card-header"><h2 className="text-xl font-semibold text-gray-900">Status</h2></div>
              <div className="card-body space-y-4">
                <div className="flex items-center"><CheckCircle className="h-5 w-5 mr-3 text-primary-600" /><div><p className="text-sm font-medium text-gray-500">Status de Confirmação</p><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${guest.confirmed ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'}`}>{guest.confirmed ? (<><CheckCircle className="h-3 w-3 mr-1" />Confirmado</>) : (<><Clock className="h-3 w-3 mr-1" />Pendente</>)}</span>{guest.confirmedAt && (<p className="text-sm text-gray-500 mt-1">Confirmado em {new Date(guest.confirmedAt).toLocaleString('pt-BR')}</p>)}</div></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="card flex flex-col items-center justify-center p-6">
              <div className="mb-4"><QrCodeIcon className="h-32 w-32 text-primary-600" /></div>
              <div className="mb-2 font-mono text-lg text-center break-all">{guest.qrCode}</div>
              {guest.qrCodeImage && (
                <button onClick={downloadQRCode} className="btn-primary mt-2">Baixar QR Code</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/events/${eventId}/guests`)} className="btn-outline inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{guestId ? 'Editar Convidado' : 'Adicionar Convidado'}</h1>
            <p className="mt-1 text-sm text-gray-500">{event?.name}</p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="card">
            <div className="card-header"><h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2></div>
            <div className="card-body space-y-4">
              <div>
                <label className="form-label">Nome *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="input" required minLength={2} />
              </div>
              <div>
                <label className="form-label">E-mail</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="form-label">Telefone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="input" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" name="confirmed" checked={form.confirmed} onChange={handleChange} id="confirmed" />
                <label htmlFor="confirmed" className="form-label">Confirmado</label>
              </div>
            </div>
          </div>
          {getCustomFields().length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="text-xl font-semibold text-gray-900">Informações Adicionais</h2></div>
              <div className="card-body space-y-4">
                {getCustomFields().map(field => (
                  <div key={field.id}>
                    <label className="form-label">{field.label}</label>
                    <input
                      type="text"
                      name={`custom_${field.id}`}
                      value={form.customFields[field.id] || ''}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <div className="text-danger-600 text-sm font-medium">{error}</div>}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary inline-flex items-center" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : guestId ? 'Salvar Alterações' : 'Salvar Convidado'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddGuest; 