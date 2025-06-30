import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import logoPreta from '../assets/logo-preta.png';
import {
  Calendar,
  Users,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  User,
  CreditCard,
  UserPlus,
  ClipboardList,
  CalendarDays,
} from 'lucide-react';
import api from '../services/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: <BarChart3 color="#6C63FF" />, color: '#6C63FF' },
  { name: 'Eventos', href: '/events', icon: <Calendar color="#00BFFF" />, color: '#00BFFF' },
  { name: 'Agendamentos', href: '/agendamentos', icon: <CalendarDays color="#8B5CF6" />, color: '#8B5CF6' },
  { name: 'Demandas', href: '/demandas', icon: <ClipboardList color="#FF00B8" />, color: '#FF00B8' },
  { name: 'Convidados', href: '/guests', icon: <Users color="#00E1A0" />, color: '#00E1A0' },
  { name: 'Check-in', href: '/checkin', icon: <QrCode color="#FFB800" />, color: '#FFB800' },
  { name: 'Plano & Faturas', href: '/plano-faturas', icon: <CreditCard color="#FF5C5C" />, color: '#FF5C5C' },
  { name: 'Gerenciar Equipe', href: '/gerenciar-equipe', icon: <UserPlus color="#6C63FF" />, color: '#6C63FF' },
  { name: 'Perfil', href: '/profile', icon: <Settings color="#00BFFF" />, color: '#00BFFF' },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showConvidadosModal, setShowConvidadosModal] = useState(false);
  const [eventosAbertos, setEventosAbertos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState('');
  const [modalTipo, setModalTipo] = useState('checkin'); // 'checkin' ou 'convidados'

  // Filtrar menus baseado no nível do usuário
  let filteredNavigation = [...navigation];
  if (user?.role === 'ORGANIZER' || (user?.nivel && !['ADMIN', 'PROPRIETARIO'].includes(user.nivel))) {
    filteredNavigation = filteredNavigation.filter(
      (item) => item.name !== 'Plano & Faturas' && item.name !== 'Gerenciar Equipe'
    );
  }

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Cores dinâmicas
  const bgSidebar = darkMode ? 'bg-[#2C3A4B]' : 'bg-white';
  const textMenu = darkMode ? 'text-white' : 'text-gray-900';
  const textMenuActive = darkMode ? 'text-[#6C63FF]' : 'text-[#6C63FF]';
  const logoSrc = darkMode ? logo : logoPreta;
  const btnCollapseBg = darkMode ? 'bg-white' : 'bg-black';
  const btnCollapseIcon = darkMode ? 'text-[#2C3A4B]' : 'text-white';
  const menuItemHover = darkMode ? 'hover:bg-[#3A4A5E]' : 'hover:bg-gray-100';
  const menuItemActive = darkMode ? 'bg-white text-[#6C63FF] font-bold shadow' : 'bg-[#F3F4F6] text-[#6C63FF] font-bold shadow';

  // Buscar eventos abertos quando abrir modal
  useEffect(() => {
    if (showCheckinModal || showConvidadosModal) {
      api.get('/events/my-events?status=active').then(res => {
        setEventosAbertos(res.data.data || []);
      });
      setEventoSelecionado('');
    }
  }, [showCheckinModal, showConvidadosModal]);

  return (
    <div className="min-h-screen">
      {/* Sidebar Fixo */}
      <div className={`${bgSidebar} ${sidebarCollapsed ? 'w-20' : 'w-72'} h-screen fixed top-0 left-0 z-30 rounded-r-3xl flex flex-col justify-between py-6 px-4 shadow-lg transition-all duration-300`}>
        {/* Topo: Logo e botão de recolher */}
        <div className="flex items-center justify-between mb-8 px-2 relative">
          <div className="flex-1 flex justify-center">
            {!sidebarCollapsed && <img src={logoSrc} alt="Logo" className="h-20 w-auto" />}
          </div>
          <button
            className={`inline-flex border border-gray-200 rounded-full p-2 shadow-md ml-2 ${btnCollapseBg} absolute right-0 top-1/2 -translate-y-1/2`}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            style={{ marginLeft: 'auto' }}
          >
            <Menu className={`h-6 w-6 ${btnCollapseIcon}`} />
          </button>
        </div>
        {/* Menu de navegação */}
        <nav className="flex-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            if (item.name === 'Check-in') {
              return (
                <button
                  key={item.name}
                  className={`w-full text-left flex items-center gap-4 px-4 py-3 my-2 rounded-r-2xl transition ${isActive(item.href) ? menuItemActive : textMenu + ' ' + menuItemHover} text-base ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  onClick={() => { setShowCheckinModal(true); setModalTipo('checkin'); }}
                  type="button"
                >
                  <span className="text-2xl" style={{ color: item.color }}>{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </button>
              );
            }
            if (item.name === 'Convidados') {
              return (
                <button
                  key={item.name}
                  className={`w-full text-left flex items-center gap-4 px-4 py-3 my-2 rounded-r-2xl transition ${isActive(item.href) ? menuItemActive : textMenu + ' ' + menuItemHover} text-base ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  onClick={() => { setShowConvidadosModal(true); setModalTipo('convidados'); }}
                  type="button"
                >
                  <span className="text-2xl" style={{ color: item.color }}>{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </button>
              );
            }
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-4 px-4 py-3 my-2 rounded-r-2xl transition ${isActive(item.href) ? menuItemActive : textMenu + ' ' + menuItemHover} text-base ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              >
                <span className="text-2xl" style={{ color: item.color }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        {/* Modal de seleção de evento para check-in ou convidados */}
        {(showCheckinModal || showConvidadosModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center">
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                {modalTipo === 'checkin' ? 'Selecione o evento para Check-in' : 'Selecione o evento para Gerenciar Convidados'}
              </h2>
              <select
                className="input w-full mb-4"
                value={eventoSelecionado}
                onChange={e => setEventoSelecionado(e.target.value)}
              >
                <option value="">Selecione um evento</option>
                {eventosAbertos.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
              <div className="flex gap-2 w-full">
                <button
                  className="btn btn-primary flex-1"
                  disabled={!eventoSelecionado}
                  onClick={() => {
                    if (modalTipo === 'checkin') {
                      setShowCheckinModal(false);
                      setShowConvidadosModal(false);
                      if (eventoSelecionado) navigate(`/events/${eventoSelecionado}/checkin`);
                    } else {
                      setShowCheckinModal(false);
                      setShowConvidadosModal(false);
                      if (eventoSelecionado) navigate(`/events/${eventoSelecionado}/guests`);
                    }
                  }}
                >Ir para {modalTipo === 'checkin' ? 'Check-in' : 'Convidados'}</button>
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => { setShowCheckinModal(false); setShowConvidadosModal(false); }}
                >Cancelar</button>
              </div>
            </div>
          </div>
        )}
        {/* Rodapé */}
        <div className={`flex flex-col items-center mt-8 gap-3 mb-4 ${sidebarCollapsed ? 'hidden' : ''}`}>
          {/* Alternância de cor */}
          <div className="flex gap-2 mb-2">
            <button
              className={`w-6 h-6 rounded-full border-2 ${darkMode ? 'border-white bg-[#2C3A4B]' : 'border-gray-400 bg-white'}`}
              onClick={() => setDarkMode(true)}
              title="Modo Escuro"
            ></button>
            <button
              className={`w-6 h-6 rounded-full border-2 ${!darkMode ? 'border-black bg-black' : 'border-gray-400 bg-white'}`}
              onClick={() => setDarkMode(false)}
              title="Modo Claro"
            ></button>
          </div>
          {/* Botão de sair */}
          <button
            onClick={logout}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg mt-2 text-sm font-semibold transition ${darkMode ? 'bg-[#3A4A5E] text-white hover:bg-[#4B5A6A]' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
          >
            <LogOut className="h-5 w-5" /> Sair
          </button>
          <span className={`text-xs mt-2 ${darkMode ? 'text-white opacity-60' : 'text-gray-500 opacity-80'}`}>v2.3.1</span>
        </div>
      </div>
      {/* Conteúdo principal */}
      <div className="ml-72 min-h-screen flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="w-full px-2 sm:px-4 transition-all duration-300">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 