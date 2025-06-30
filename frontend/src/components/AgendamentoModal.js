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
  });

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
      });
    } else {
      setForm({
        titulo: '', 
        descricao: '', 
        dataInicio: '', 
        dataFim: '', 
        categoria: 'Reunião', 
        lembreteMinutosAntes: 30, 
        visibilidade: 'PRIVADO'
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
                  onClick={onDelete}
                >
                  Excluir
                </button>
                <button 
                  type="button" 
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors" 
                  onClick={onNotificar}
                >
                  🔔 Notificar
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 