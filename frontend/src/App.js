import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import Guests from './pages/Guests';
import GuestDetails from './pages/GuestDetails';
import CheckIn from './pages/CheckIn';
import Profile from './pages/Profile';
import PlanoFaturas from './pages/PlanoFaturas';
import GerenciarEquipe from './pages/GerenciarEquipe';
import PublicEvent from './pages/PublicEvent';
import FormBuilderPage from './pages/FormBuilderPage';
import PublicPageEditorPage from './pages/PublicPageEditorPage';
import InviteAccept from './pages/InviteAccept';
import SubEventosPage from './pages/SubEventosPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Empresas from './pages/admin/Empresas';
import Planos from './pages/admin/Planos';
import Faturas from './pages/admin/Faturas';
import Admins from './pages/admin/Admins';
import Logs from './pages/admin/Logs';
import Eventos from './pages/admin/Eventos';
import AdminLogin from './pages/admin/Login';
import AdminRoute from './components/admin/AdminRoute';
import Demandas from './pages/Demandas';
import AddGuest from './pages/AddGuest';
import Agendamentos from './pages/Agendamentos';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminAuthProvider>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/event/:eventId" element={<PublicEvent />} />
              <Route path="/event/:eventId/register" element={<PublicEvent />} />
              <Route path="/event/:eventId/formulario" element={<PublicEvent />} />
              <Route path="/preview/event/:eventId" element={<PublicEvent />} />
              
              {/* Rotas públicas por slug personalizado */}
              <Route path="/e/:slug" element={<PublicEvent />} />
              <Route path="/e/:slug/register" element={<PublicEvent />} />
              <Route path="/e/:slug/formulario" element={<PublicEvent />} />
              <Route path="/preview/e/:slug" element={<PublicEvent />} />
              
              {/* Rota de convite (pública mas pode requerer login) */}
              <Route path="/convite/:token" element={<InviteAccept />} />
              
              {/* Rotas protegidas */}
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="events" element={<Events />} />
                <Route path="events/create" element={<CreateEvent />} />
                <Route path="events/:eventId" element={<EventDetails />} />
                <Route path="events/:eventId/edit" element={<EditEvent />} />
                <Route path="events/:eventId/guests" element={<Guests />} />
                <Route path="events/:eventId/guests/add" element={<AddGuest />} />
                <Route path="events/:eventId/guests/:guestId/edit" element={<AddGuest />} />
                <Route path="events/:eventId/guests/:guestId/details" element={<GuestDetails />} />
                <Route path="events/:eventId/checkin" element={<CheckIn />} />
                <Route path="events/:eventId/subeventos" element={<SubEventosPage />} />
                <Route path="events/:eventId/form-builder" element={<FormBuilderPage />} />
                <Route path="events/:eventId/page-editor" element={<PublicPageEditorPage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="plano-faturas" element={<PlanoFaturas />} />
                <Route path="gerenciar-equipe" element={<GerenciarEquipe />} />
                <Route path="demandas" element={<Demandas />} />
                <Route path="agendamentos" element={<Agendamentos />} />
              </Route>
              
              {/* Rota de login do painel master admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Rotas do painel master admin (protegidas) */}
              <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
              <Route path="/admin/empresas" element={<AdminRoute><AdminLayout><Empresas /></AdminLayout></AdminRoute>} />
              <Route path="/admin/planos" element={<AdminRoute><AdminLayout><Planos /></AdminLayout></AdminRoute>} />
              <Route path="/admin/faturas" element={<AdminRoute><AdminLayout><Faturas /></AdminLayout></AdminRoute>} />
              <Route path="/admin/admins" element={<AdminRoute><AdminLayout><Admins /></AdminLayout></AdminRoute>} />
              <Route path="/admin/logs" element={<AdminRoute><AdminLayout><Logs /></AdminLayout></AdminRoute>} />
              <Route path="/admin/eventos" element={<AdminRoute><AdminLayout><Eventos /></AdminLayout></AdminRoute>} />
              
              {/* Rota 404 */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Página não encontrada</p>
                    <a href="/login" className="text-blue-600 hover:text-blue-800">
                      Voltar ao login
                    </a>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 