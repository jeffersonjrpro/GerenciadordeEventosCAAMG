import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

const categorias = [
  { value: 'Reunião', color: 'bg-blue-500' },
  { value: 'Tarefa', color: 'bg-green-500' },
  { value: 'Visita', color: 'bg-yellow-500' },
  { value: 'Outro', color: 'bg-gray-400' },
];

export default function AgendamentoModal({ 
  open = false, 
  onClose = () => {}, 
  onSave = () => {}, 
  onDelete = () => {}, 
  onNotificar = () => {}, 
  agendamento = null, 
  modoEdicao = false 
}) {
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    categoria: 'Reunião',
    lembreteMinutosAntes: 30,
    visibilidade: 'PRIVADO',
    notificarAutomaticamente: true,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (agendamento) {
      setForm({
        titulo: agendamento.titulo || '',
        descricao: agendamento.descricao || '',
        dataInicio: agendamento.dataInicio ? dayjs(agendamento.dataInicio).format('YYYY-MM-DDTHH:mm') : '',
        dataFim: agendamento.dataFim ? dayjs(agendamento.dataFim).format('YYYY-MM-DDTHH:mm') : '',
        categoria: agendamento.categoria || 'Reunião',
        lembreteMinutosAntes: agendamento.lembreteMinutosAntes || 30,
        visibilidade: agendamento.visibilidade || 'PRIVADO',
        notificarAutomaticamente: agendamento.notificarAutomaticamente || true,
      });
    } else {
      setForm({
        titulo: '', 
        descricao: '', 
        dataInicio: '', 
        dataFim: '', 
        categoria: 'Reunião', 
        lembreteMinutosAntes: 30, 
        visibilidade: 'PRIVADO',
        notificarAutomaticamente: true,
      });
    }
  }, [agendamento, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.titulo || !form.dataInicio || !form.dataFim) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    onSave(form);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-lg p-6 relative max-h-screen overflow-y-auto">
        <button 
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" 
          onClick={onClose}
          type="button"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {modoEdicao ? 'Editar Agendamento' : 'Novo Agendamento'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input 
            name="titulo" 
            value={form.titulo} 
            onChange={handleChange} 
            required 
            placeholder="Título*" 
            className="w-full p-2 rounded border dark:bg-gray-800 dark:text-white dark:border-gray-600" 
          />
          <textarea 
            name="descricao" 
            value={form.descricao} 
            onChange={handleChange} 
            placeholder="Descrição" 
            rows={3}
            className="w-full p-2 rounded border dark:bg-gray-800 dark:text-white dark:border-gray-600" 
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 dark:text-gray-300">Início*</label>
              <input 
                type="datetime-local" 
                name="dataInicio" 
                value={form.dataInicio} 
                onChange={handleChange} 
                required 
                className="w-full p-2 rounded border dark:bg-gray-800 dark:text-white dark:border-gray-600" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 dark:text-gray-300">Fim*</label>
              <input 
                type="datetime-local" 
                name="dataFim" 
                value={form.dataFim} 
                onChange={handleChange} 
                required 
                className="w-full p-2 rounded border dark:bg-gray-800 dark:text-white dark:border-gray-600" 
              />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <select 
              name="categoria" 
              value={form.categoria} 
              onChange={handleChange} 
              className="p-2 rounded border dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              {categorias.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.value}</option>
              ))}
            </select>
            <input 
              type="number" 
              name="lembreteMinutosAntes" 
              value={form.lembreteMinutosAntes} 
              onChange={handleChange} 
              min={1} 
              max={1440} 
              className="w-24 p-2 rounded border dark:bg-gray-800 dark:text-white dark:border-gray-600" 
            />
            <span className="text-xs text-gray-600 dark:text-gray-300">min antes</span>
          </div>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-1 text-gray-900 dark:text-white">
              <input 
                type="radio" 
                name="visibilidade" 
                value="PRIVADO" 
                checked={form.visibilidade === 'PRIVADO'} 
                onChange={handleChange} 
              />
              <span>🔒 Privado</span>
            </label>
            <label className="flex items-center gap-1 text-gray-900 dark:text-white">
              <input 
                type="radio" 
                name="visibilidade" 
                value="EQUIPE" 
                checked={form.visibilidade === 'EQUIPE'} 
                onChange={handleChange} 
              />
              <span>👥 Equipe</span>
            </label>
          </div>
          
          {/* Checkbox para notificação automática */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="notificarAutomaticamente" 
              checked={form.notificarAutomaticamente} 
              onChange={(e) => setForm(f => ({ ...f, notificarAutomaticamente: e.target.checked }))}
              className="rounded"
            />
            <label className="text-gray-900 dark:text-white">
              🔔 Notificar automaticamente
            </label>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
            {modoEdicao && (
              <>
                <button 
                  type="button" 
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors" 
                  onClick={handleDeleteClick}
                >
                  Excluir
                </button>
                <button 
                  type="button" 
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors" 
                  onClick={onNotificar}
                >
                  🔔 Notificar Agora
                </button>
              </>
            )}
            {!modoEdicao && form.notificarAutomaticamente && (
              <button 
                type="button" 
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors" 
                disabled
              >
                🔔 Notificação Automática
              </button>
            )}
          </div>
        </form>

        {/* Popup de confirmação de exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 transform transition-all">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Confirmar exclusão
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Você está prestes a excluir o agendamento:
                </p>
                <p className="font-medium text-gray-900 dark:text-white mt-1">
                  "{form.titulo}"
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {form.dataInicio && form.dataFim && (
                    `${dayjs(form.dataInicio).format('DD/MM/YYYY HH:mm')} - ${dayjs(form.dataFim).format('HH:mm')}`
                  )}
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 