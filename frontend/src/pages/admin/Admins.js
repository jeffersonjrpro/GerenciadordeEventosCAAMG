import React, { useState, useEffect } from 'react';
import { getAllAdmins } from '../../services/adminApi';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editAdmin, setEditAdmin] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', email: '', nivel: '', ativo: true });
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await getAllAdmins();
      // Unifica adminMasters e adminsUsers em um único array, padronizando os campos
      const masters = (data.adminMasters || []).map(a => ({
        id: a.id,
        nome: a.nome,
        email: a.email,
        nivel: a.nivel,
        ativo: a.ativo,
        criadoEm: a.criadoEm,
        tipo: 'master',
      }));
      const users = (data.adminsUsers || []).map(u => ({
        id: u.id,
        nome: u.name,
        email: u.email,
        nivel: u.nivel,
        ativo: u.ativo,
        criadoEm: u.createdAt,
        tipo: 'user',
      }));
      setAdmins([...masters, ...users]);
    } catch (err) {
      setError('Erro ao carregar administradores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (id) => {
    alert('Função de bloqueio/desbloqueio disponível apenas para admin master.');
  };

  const handleEdit = (admin) => {
    if (admin.tipo === 'user') {
      alert('Edição de usuários admin ainda não implementada por aqui. Use o painel de usuários.');
      return;
    }
    setEditForm({
      nome: admin.nome || '',
      email: admin.email || '',
      nivel: admin.nivel || '',
      ativo: admin.ativo,
    });
    setEditAdmin(admin);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditSave = async () => {
    alert('Edição de admin master desabilitada nesta versão.');
    setShowEditModal(false);
    setEditAdmin(null);
    setNewPassword('');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando administradores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Admins</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Novo Admin
        </button>
      </div>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{admin.nome}</div>
                  <div className="text-xs text-gray-400">{admin.tipo === 'master' ? 'Admin Master' : 'Usuário Admin'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{admin.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {admin.nivel}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {admin.ativo ? 'Ativo' : 'Bloqueado'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {admin.criadoEm ? new Date(admin.criadoEm).toLocaleString('pt-BR') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-yellow-600 hover:text-yellow-900 mr-3" onClick={() => handleEdit(admin)}>
                    Editar
                  </button>
                  <button 
                    onClick={() => handleBlock(admin.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    {admin.ativo ? 'Bloquear' : 'Desbloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de edição de admin */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-[480px] max-w-full relative flex flex-col gap-2">
            <button className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-700" onClick={() => setShowEditModal(false)}>&times;</button>
            <h3 className="text-2xl font-bold mb-4 text-primary-700 text-center">Editar Admin</h3>
            <div className="mb-3">
              <label className="block font-semibold mb-1">Nome</label>
              <input className="border w-full px-3 py-2 rounded" name="nome" value={editForm.nome} onChange={handleEditChange} />
            </div>
            <div className="mb-3">
              <label className="block font-semibold mb-1">Email</label>
              <input className="border w-full px-3 py-2 rounded" name="email" value={editForm.email} onChange={handleEditChange} />
            </div>
            <div className="mb-3">
              <label className="block font-semibold mb-1">Nível</label>
              <select className="border w-full px-3 py-2 rounded" name="nivel" value={editForm.nivel} onChange={handleEditChange}>
                <option value="MASTER">Master</option>
                <option value="SUPORTE">Suporte</option>
                <option value="LEITURA">Leitura</option>
              </select>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <label className="font-semibold">Ativo</label>
              <input type="checkbox" name="ativo" checked={editForm.ativo} onChange={handleEditChange} />
            </div>
            <div className="mb-3">
              <label className="block font-semibold mb-1">Nova senha</label>
              <input className="border w-full px-3 py-2 rounded" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha..." />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleEditSave} disabled={saving} type="button">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 