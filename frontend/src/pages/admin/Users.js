import React, { useEffect, useState, useContext } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';
import { AdminAuthContext } from '../../contexts/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, BuildingOffice2Icon, EnvelopeIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const niveis = [
  { value: 'PROPRIETARIO', label: 'Proprietário' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CHECKIN', label: 'Check-in' },
];

function Users() {
  const { admin } = useContext(AdminAuthContext);
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', nivel: 'CHECKIN', empresaId: '' });
  const [editId, setEditId] = useState(null);
  const [empresaId, setEmpresaId] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => {
    if (!admin || admin.nivel !== 'MASTER') {
      navigate('/admin');
    }
  }, [admin, navigate]);

  useEffect(() => {
    // Buscar empresaId do admin logado (ajustar conforme contexto real)
    const eid = localStorage.getItem('empresaId') || '';
    setEmpresaId(eid);
    fetchUsuarios(eid);
  }, []);

  const fetchUsuarios = async (eid) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users?empresaId=${eid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(res.data);
    } catch (err) {
      alert('Erro ao buscar usuários');
    }
    setLoading(false);
  };

  const handleEdit = (user) => {
    setForm({
      nome: user.name,
      email: user.email,
      telefone: user.telefone || '',
      nivel: user.nivel,
      empresaId: user.empresaId,
    });
    setEditId(user.id);
    setModal(true);
  };

  const handleBlock = async (user) => {
    if (!window.confirm(`Deseja realmente ${user.ativo ? 'bloquear' : 'desbloquear'} este usuário?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/users/${user.id}/block`, { ativo: !user.ativo }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsuarios(empresaId);
    } catch (err) {
      alert('Erro ao bloquear/desbloquear usuário');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm('Deseja realmente remover este usuário?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { empresaId },
      });
      fetchUsuarios(empresaId);
    } catch (err) {
      alert('Erro ao remover usuário');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editId) {
        await axios.put(`${API_URL}/users/${editId}`, { ...form, empresaId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/users`, { ...form, empresaId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setModal(false);
      setEditId(null);
      setForm({ nome: '', email: '', telefone: '', nivel: 'CHECKIN', empresaId });
      fetchUsuarios(empresaId);
    } catch (err) {
      alert('Erro ao salvar usuário');
    }
  };

  const handleShowDetails = async (user) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/usuarios/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUserDetail(data);
      setDetailModal(true);
    } catch (err) {
      alert('Erro ao buscar detalhes do usuário');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Gerenciamento de Usuários</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4" onClick={() => { setModal(true); setEditId(null); setForm({ nome: '', email: '', telefone: '', nivel: 'CHECKIN', empresaId }); }}>Novo Usuário</button>
        {loading ? <p>Carregando...</p> : (
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Nome</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Telefone</th>
                <th className="border px-2 py-1">Nível</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.id} className={!user.ativo ? 'bg-red-100' : ''}>
                  <td className="border px-2 py-1">{user.name}</td>
                  <td className="border px-2 py-1">{user.email}</td>
                  <td className="border px-2 py-1">{user.telefone}</td>
                  <td className="border px-2 py-1">{user.nivel}</td>
                  <td className="border px-2 py-1">{user.ativo ? 'Ativo' : 'Bloqueado'}</td>
                  <td className="border px-2 py-1 space-x-2 flex items-center">
                    <button className="text-blue-600" onClick={() => handleEdit(user)}>Editar</button>
                    <button className="text-yellow-600" onClick={() => handleBlock(user)}>{user.ativo ? 'Bloquear' : 'Desbloquear'}</button>
                    <button className="text-red-600" onClick={() => handleDelete(user)}>Remover</button>
                    <button className="text-gray-700 hover:text-blue-700 ml-2" title="Detalhes" onClick={() => handleShowDetails(user)}>
                      <EyeIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal de Detalhes do Usuário */}
        {detailModal && userDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setDetailModal(false)}>&times;</button>
              <div className="flex items-center mb-4">
                <UserIcon className="h-8 w-8 text-blue-600 mr-2" />
                <h3 className="text-xl font-bold">Detalhes do Usuário</h3>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center"><EnvelopeIcon className="h-5 w-5 mr-2 text-gray-500" /> <span className="font-medium">Email:</span> <span className="ml-1">{userDetail.email}</span></div>
                <div className="flex items-center"><PhoneIcon className="h-5 w-5 mr-2 text-gray-500" /> <span className="font-medium">Telefone:</span> <span className="ml-1">{userDetail.telefone || 'Não informado'}</span></div>
                <div className="flex items-center"><span className="font-medium">Nível:</span> <span className="ml-1">{userDetail.nivel}</span></div>
                <div className="flex items-center"><span className="font-medium">Status:</span> <span className={userDetail.ativo ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>{userDetail.ativo ? 'Ativo' : 'Bloqueado'}</span></div>
                <div className="flex items-center"><span className="font-medium">Criado em:</span> <span className="ml-1">{new Date(userDetail.createdAt).toLocaleString('pt-BR')}</span></div>
                <div className="flex items-center"><span className="font-medium">Atualizado em:</span> <span className="ml-1">{new Date(userDetail.updatedAt).toLocaleString('pt-BR')}</span></div>
              </div>
              <div className="mb-4">
                <div className="flex items-center mb-1"><BuildingOffice2Icon className="h-5 w-5 mr-2 text-gray-500" /> <span className="font-medium">Empresa vinculada:</span></div>
                {userDetail.empresa ? (
                  <div className="ml-7 text-sm">
                    <div><span className="font-medium">Nome:</span> {userDetail.empresa.nome}</div>
                    <div><span className="font-medium">Status:</span> {userDetail.empresa.status}</div>
                  </div>
                ) : <div className="ml-7 text-sm text-gray-500">Nenhuma empresa vinculada</div>}
              </div>
              <div>
                <div className="flex items-center mb-1"><BuildingOffice2Icon className="h-5 w-5 mr-2 text-gray-500" /> <span className="font-medium">Empresas criadas:</span></div>
                {userDetail.empresasCriadas && userDetail.empresasCriadas.length > 0 ? (
                  <ul className="ml-7 text-sm list-disc">
                    {userDetail.empresasCriadas.map(emp => (
                      <li key={emp.id}><span className="font-medium">{emp.nome}</span> ({emp.status})</li>
                    ))}
                  </ul>
                ) : <div className="ml-7 text-sm text-gray-500">Nenhuma empresa criada</div>}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição/Cadastro */}
        {modal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <form className="bg-white p-6 rounded shadow-md w-96" onSubmit={handleSubmit}>
              <h3 className="text-lg font-bold mb-2">{editId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <div className="mb-2">
                <label className="block">Nome</label>
                <input className="border w-full px-2 py-1" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="mb-2">
                <label className="block">Email</label>
                <input className="border w-full px-2 py-1" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="mb-2">
                <label className="block">Telefone</label>
                <input className="border w-full px-2 py-1" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="block">Nível</label>
                <select className="border w-full px-2 py-1" value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value })}>
                  {niveis.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => { setModal(false); setEditId(null); }}>Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Users; 