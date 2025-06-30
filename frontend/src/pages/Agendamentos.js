import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import {
  getAgendamentos,
  createAgendamento,
  updateAgendamento,
  deleteAgendamento,
  notificarAgendamento
} from '../services/agendamentoApi';
import AgendamentoModal from '../components/AgendamentoModal';

// Configurar dayjs para português
dayjs.locale('pt-br');

const categoriaCores = {
  'Reunião': '#3B82F6',
  'Tarefa': '#10B981',
  'Visita': '#F59E0B',
  'Outro': '#6B7280',
};

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const carregarAgendamentos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAgendamentos();
      setAgendamentos(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      setError('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  const handleDateClick = (info) => {
    const dataHora = dayjs(info.date);
    setAgendamentoSelecionado({
      dataInicio: dataHora.format('YYYY-MM-DDTHH:mm'),
      dataFim: dataHora.add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      categoria: 'Reunião',
      visibilidade: 'PRIVADO',
      lembreteMinutosAntes: 30
    });
    setModalEdicao(false);
    setModalOpen(true);
  };

  const handleEventClick = (info) => {
    const ag = agendamentos.find(a => a.id === info.event.id);
    if (ag) {
      setAgendamentoSelecionado(ag);
      setModalEdicao(true);
      setModalOpen(true);
    }
  };

  const handleSalvar = async (form) => {
    try {
      setError('');
      if (modalEdicao && agendamentoSelecionado) {
        await updateAgendamento(agendamentoSelecionado.id, form);
      } else {
        await createAgendamento(form);
      }
      setModalOpen(false);
      await carregarAgendamentos();
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      setError('Erro ao salvar agendamento');
    }
  };

  const handleExcluir = async () => {
    if (!agendamentoSelecionado) return;
    
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        setError('');
        await deleteAgendamento(agendamentoSelecionado.id);
        setModalOpen(false);
        await carregarAgendamentos();
      } catch (err) {
        console.error('Erro ao excluir agendamento:', err);
        setError('Erro ao excluir agendamento');
      }
    }
  };

  const handleNotificar = async () => {
    if (!agendamentoSelecionado) return;
    
    try {
      setError('');
      await notificarAgendamento(agendamentoSelecionado.id);
      alert('Lembrete enviado com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar lembrete:', err);
      setError('Erro ao enviar lembrete');
    }
  };

  const events = agendamentos.map(a => ({
    id: a.id,
    title: `${a.visibilidade === 'EQUIPE' ? '👥 ' : '🔒 '}${a.titulo}`,
    start: a.dataInicio,
    end: a.dataFim,
    backgroundColor: categoriaCores[a.categoria] || '#6B7280',
    borderColor: categoriaCores[a.categoria] || '#6B7280',
    extendedProps: { ...a }
  }));

  return (
    <div className="p-4 relative min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Agendamentos</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          onClick={() => { 
            setModalOpen(true); 
            setModalEdicao(false); 
            setAgendamentoSelecionado(null); 
          }}
        >
          ➕ Novo Agendamento
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600 dark:text-gray-300">Carregando agendamentos...</div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="pt-br"
            headerToolbar={{ 
              left: 'prev,next today', 
              center: 'title', 
              right: 'dayGridMonth,timeGridWeek,timeGridDay' 
            }}
            buttonText={{
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia'
            }}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            selectable={true}
            dayMaxEvents={3}
            moreLinkText="mais"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
          />
        </div>
      )}

      {/* Botão flutuante para mobile */}
      <button
        className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl shadow-lg hover:bg-blue-700 z-50 lg:hidden"
        onClick={() => { 
          setModalOpen(true); 
          setModalEdicao(false); 
          setAgendamentoSelecionado(null); 
        }}
        title="Novo agendamento"
      >
        +
      </button>

      <AgendamentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSalvar}
        onDelete={handleExcluir}
        onNotificar={handleNotificar}
        agendamento={agendamentoSelecionado}
        modoEdicao={modalEdicao}
      />
    </div>
  );
} 