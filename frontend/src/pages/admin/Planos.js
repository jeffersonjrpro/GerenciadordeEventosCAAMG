import React, { useState, useEffect } from 'react';
import { getPlanos, updatePlano, deletePlano } from '../../services/adminApi';
import ConfirmationModal from '../../components/ConfirmationModal';
import toast, { Toaster } from 'react-hot-toast';

export default function Planos() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPlano, setEditingPlano] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState(null);

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      setLoading(true);
      const data = await getPlanos();
      setPlanos(data);
    } catch (err) {
      setError('Erro ao carregar planos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlano = (plano) => {
    setEditingPlano({ ...plano });
    setShowEditModal(true);
  };

  const handleUpdatePlano = async (e) => {
    e.preventDefault();
    
    const updatePromise = updatePlano(editingPlano.id, editingPlano);
    
    toast.promise(updatePromise, {
      loading: 'Atualizando plano...',
      success: 'Plano atualizado com sucesso!',
      error: 'Erro ao atualizar plano'
    });

    try {
      await updatePromise;
      setShowEditModal(false);
      setEditingPlano(null);
      await loadPlanos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlano = (plano) => {
    setPlanoToDelete(plano);
    setShowDeleteModal(true);
  };

  const confirmDeletePlano = async () => {
    const deletePromise = deletePlano(planoToDelete.id);
    
    toast.promise(deletePromise, {
      loading: 'Excluindo plano...',
      success: 'Plano excluído com sucesso!',
      error: 'Erro ao excluir plano'
    });

    try {
      await deletePromise;
      await loadPlanos();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando planos...</div>
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
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planos</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Novo Plano
        </button>
      </div>

      {planos.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Nenhum plano encontrado
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limite de Eventos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limite de Convidados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {planos.map((plano) => (
                <tr key={plano.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{plano.nome}</div>
                    {plano.descricao && (
                      <div className="text-xs text-gray-500">{plano.descricao}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {plano.preco.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plano.limiteEventos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plano.limiteConvidados.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plano._count?.empresas || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditPlano(plano)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeletePlano(plano)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && editingPlano && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Plano</h2>
            <form onSubmit={handleUpdatePlano}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={editingPlano.nome}
                  onChange={(e) => setEditingPlano({...editingPlano, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={editingPlano.descricao || ''}
                  onChange={(e) => setEditingPlano({...editingPlano, descricao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPlano.preco}
                  onChange={(e) => setEditingPlano({...editingPlano, preco: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Eventos
                </label>
                <input
                  type="number"
                  value={editingPlano.limiteEventos}
                  onChange={(e) => setEditingPlano({...editingPlano, limiteEventos: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Convidados
                </label>
                <input
                  type="number"
                  value={editingPlano.limiteConvidados}
                  onChange={(e) => setEditingPlano({...editingPlano, limiteConvidados: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlano(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPlanoToDelete(null);
        }}
        onConfirm={confirmDeletePlano}
        title="Excluir Plano"
        message={`Tem certeza que deseja excluir o plano "${planoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
 