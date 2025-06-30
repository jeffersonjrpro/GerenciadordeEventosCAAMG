import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const links = [
  { to: '/admin/dashboard', label: 'Estatísticas' },
  { to: '/admin/empresas', label: 'Empresas' },
  { to: '/admin/planos', label: 'Planos' },
  { to: '/admin/faturas', label: 'Faturas' },
  { to: '/admin/eventos', label: 'Eventos' },
  { to: '/admin/admins', label: 'Usuários' },
  { to: '/admin/logs', label: 'Logs' },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { adminData } = useAdminAuth();
  return (
    <aside className="w-56 bg-white border-r h-screen p-4 flex flex-col">
      <div className="font-bold text-lg mb-8">Painel Master</div>
      <nav className="flex-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`block px-3 py-2 rounded mb-2 hover:bg-blue-100 transition font-medium ${pathname.startsWith(link.to) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 