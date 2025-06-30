import React, { useEffect, useState } from 'react';
import api from '../services/api';
// Importe seus componentes de UI ou use HTML + Tailwind
// import { Badge, Button, Input, Select, Modal, Avatar, Textarea } from '@components/ui';
import { Plus, Filter, Eye, Edit, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const prioridadeColors = {
  ALTA: 'bg-red-100 text-red-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  BAIXA: 'bg-green-100 text-green-800'
};
const statusColors = {
  ABERTO: 'bg-blue-100 text-blue-800',
  EM_ANDAMENTO: 'bg-yellow-100 text-yellow-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  PAUSADO: 'bg-gray-100 text-gray-800'
};

export default function Demandas({ sidebarCollapsed }) {
  const { user } = useAuth();
  const [setores, setSetores] = useState([]);
  const [demandas, setDemandas] = useState([]);
  const [filtros, setFiltros] = useState({ setorId: '', status: '', prioridade: '', nomeProjeto: '', solicitacao: '' });
  const [showModal, setShowModal] = useState(false);
  const [novaDemanda, setNovaDemanda] = useState({ solicitante: user?.name || '' });
  const [detalhe, setDetalhe] = useState(null);
  const [showNovoSetor, setShowNovoSetor] = useState(false);
  const [novoSetorNome, setNovoSetorNome] = useState('');
  const [observacoes, setObservacoes] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [erroSetor, setErroSetor] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [editandoDemandaId, setEditandoDemandaId] = useState(null);
  const [estatisticas, setEstatisticas] = useState({ abertas: 0, emAndamento: 0, concluidas: 0, pausadas: 0, total: 0 });

  const carregarEstatisticas = async () => {
    try {
      const { data } = await api.get('/demandas/estatisticas');
      setEstatisticas(data);
    } catch {}
  };

  useEffect(() => {
    carregarSetores();
    carregarDemandas();
    const carregarUsuarios = async () => {
      try {
        const { data } = await api.get('/users/equipe');
        setUsuarios(data || []);
      } catch {
        setUsuarios([]);
      }
    };
    carregarUsuarios();
    carregarEstatisticas();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarSetores = async () => {
    const { data } = await api.get('/setores');
    setSetores(data);
  };

  const carregarDemandas = async (pagina = 1) => {
    const { data } = await api.get('/demandas', { params: { ...filtros, page: pagina, limit: 10 } });
    setDemandas(data.demandas || []);
    await carregarEstatisticas();
  };

  const handleFiltro = e => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  const handleCriarDemanda = async () => {
    if (!novaDemanda.setorId) {
      setErroSetor('Selecione um setor para a demanda.');
      return;
    }
    setErroSetor('');
    try {
      if (editandoDemandaId) {
        await api.put(`/demandas/${editandoDemandaId}`, {
          ...novaDemanda,
          descricao,
          observacoesIniciais: observacoes.map(obs => ({ texto: obs.texto, autorId: user.id })),
        });
        toast.success('Demanda atualizada!');
      } else {
        await api.post('/demandas', {
          ...novaDemanda,
          descricao,
          observacoesIniciais: observacoes.map(obs => ({ texto: obs.texto, autorId: user.id })),
        });
        toast.success('Demanda criada!');
      }
      setShowModal(false);
      setNovaDemanda({ solicitante: user?.name || '' });
      setDescricao('');
      setObservacoes([]);
      setEditandoDemandaId(null);
      carregarDemandas();
    } catch {
      toast.error(editandoDemandaId ? 'Erro ao atualizar demanda' : 'Erro ao criar demanda');
    }
  };

  const handleAdicionarObservacao = () => {
    setObservacoes([...observacoes, { texto: '', data: new Date().toISOString() }]);
  };

  const handleObservacaoChange = (idx, value) => {
    setObservacoes(observacoes.map((obs, i) => i === idx ? { ...obs, texto: value } : obs));
  };

  const handleCriarSetor = async () => {
    if (!novoSetorNome.trim()) return;
    try {
      await api.post('/setores', { nome: novoSetorNome });
      toast.success('Setor criado!');
      setNovoSetorNome('');
      setShowNovoSetor(false);
      carregarSetores();
    } catch {
      toast.error('Erro ao criar setor');
    }
  };

  const handleExcluirDemanda = async () => {
    if (!detalhe) return;
    try {
      await api.delete(`/demandas/${detalhe.id}`);
      toast.success('Demanda excluída!');
      setDetalhe(null);
      carregarDemandas();
    } catch {
      toast.error('Erro ao excluir demanda');
    }
  };

  return (
    <div className="transition-all duration-300 w-full px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Demandas & Projetos</h1>
        <button className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center" onClick={() => setShowModal(true)}>
          <Plus size={18}/>Nova Demanda
        </button>
      </div>

      {/* Cards de Estatísticas Responsivos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-600 rounded-xl p-3 md:p-4 text-white shadow flex flex-col justify-between min-h-[80px]">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm md:text-base">Abertas</span>
            <svg className="w-6 h-6 md:w-8 md:h-8 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2">{estatisticas.abertas}</div>
        </div>
        <div className="bg-yellow-500 rounded-xl p-3 md:p-4 text-white shadow flex flex-col justify-between min-h-[80px]">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm md:text-base">Em Andamento</span>
            <svg className="w-6 h-6 md:w-8 md:h-8 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12" rx="3"/>
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2">{estatisticas.emAndamento}</div>
        </div>
        <div className="bg-green-600 rounded-xl p-3 md:p-4 text-white shadow flex flex-col justify-between min-h-[80px]">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm md:text-base">Concluídas</span>
            <svg className="w-6 h-6 md:w-8 md:h-8 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 12 10 16 18 8"/>
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2">{estatisticas.concluidas}</div>
        </div>
        <div className="bg-gray-500 rounded-xl p-3 md:p-4 text-white shadow flex flex-col justify-between min-h-[80px]">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm md:text-base">Pausadas</span>
            <svg className="w-6 h-6 md:w-8 md:h-8 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="8" y="6" width="3" height="12"/><rect x="13" y="6" width="3" height="12"/>
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2">{estatisticas.pausadas}</div>
        </div>
      </div>

      {/* Filtros Responsivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-4">
        <select name="setorId" value={filtros.setorId} onChange={handleFiltro} className="input text-sm">
          <option value="">Todos Setores</option>
          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <select name="status" value={filtros.status} onChange={handleFiltro} className="input text-sm">
          <option value="">Todos Status</option>
          <option value="ABERTO">Aberto</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="PAUSADO">Pausado</option>
        </select>
        <select name="prioridade" value={filtros.prioridade} onChange={handleFiltro} className="input text-sm">
          <option value="">Todas Prioridades</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Média</option>
          <option value="BAIXA">Baixa</option>
        </select>
        <input name="nomeProjeto" placeholder="Buscar projeto..." value={filtros.nomeProjeto} onChange={handleFiltro} className="input text-sm" />
        <input name="solicitacao" placeholder="Nº Solicitação" value={filtros.solicitacao || ''} onChange={handleFiltro} className="input text-sm" />
        <button className="btn btn-secondary flex items-center gap-2 justify-center text-sm" onClick={carregarDemandas}>
          <Filter size={16}/>Filtrar
        </button>
      </div>

      {/* Container da Tabela Responsivo */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Sol.</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prior.</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fluig</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resp.</th>
                <th className="px-2 md:px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {demandas.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-2 md:px-4 py-2 max-w-[120px] md:max-w-none truncate">
                    <div className="font-medium text-sm">{d.nomeProjeto}</div>
                  </td>
                  <td className="px-2 md:px-4 py-2 whitespace-nowrap font-mono text-blue-700 text-sm">{d.solicitacao}</td>
                  <td className="px-2 md:px-4 py-2 whitespace-nowrap text-sm">{d.setor?.nome}</td>
                  <td className="px-2 md:px-4 py-2 max-w-[150px] md:max-w-xs truncate text-sm" title={d.descricao || ''}>
                    {d.descricao ? (d.descricao.length > 40 ? d.descricao.slice(0, 40) + '...' : d.descricao) : '-'}
                  </td>
                  <td className="px-2 md:px-4 py-2 whitespace-nowrap">
                    <span className={`px-1 md:px-2 py-1 rounded text-xs md:text-sm ${prioridadeColors[d.prioridade]}`}>
                      {d.prioridade === 'ALTA' ? 'A' : d.prioridade === 'MEDIA' ? 'M' : 'B'}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-2 whitespace-nowrap">
                    <span className={`px-1 md:px-2 py-1 rounded text-xs md:text-sm ${statusColors[d.status]}`}>
                      {d.status === 'ABERTO' ? 'Aberto' : d.status === 'EM_ANDAMENTO' ? 'Andamento' : d.status === 'CONCLUIDO' ? 'Concluído' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-2 whitespace-nowrap text-sm">{new Date(d.dataEntrega).toLocaleDateString('pt-BR')}</td>
                  <td className="px-2 md:px-4 py-2 whitespace-nowrap font-mono text-green-700 text-sm">{d.numeroFluig || '-'}</td>
                  <td className="px-2 md:px-4 py-2 whitespace-nowrap">
                    <div className="flex flex-col gap-1 max-w-[80px]">
                      {d.responsaveis.slice(0, 2).map(u => {
                        const nome = u.name || u.nome || '';
                        const partes = nome.trim().split(' ');
                        const primeiro = partes[0] || '';
                        return (
                          <span key={u.id} className="text-xs font-semibold text-blue-700 leading-none truncate">
                            {primeiro}
                          </span>
                        );
                      })}
                      {d.responsaveis.length > 2 && (
                        <span className="text-xs text-gray-500">+{d.responsaveis.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-1 md:gap-2 items-center">
                      <button className="btn btn-sm btn-outline flex items-center p-1 md:p-2" title="Ver Detalhes" onClick={() => setDetalhe(d)}>
                        <Eye size={14}/>
                      </button>
                      <button className="btn btn-sm btn-outline flex items-center p-1 md:p-2" title="Editar Demanda" onClick={() => {
                        setNovaDemanda({
                          nomeProjeto: d.nomeProjeto,
                          setorId: d.setor?.id,
                          solicitante: d.solicitante,
                          prioridade: d.prioridade,
                          status: d.status,
                          dataEntrega: d.dataEntrega ? d.dataEntrega.split('T')[0] : '',
                          linkPastaProjeto: d.linkPastaProjeto || '',
                          linkSite: d.linkSite || '',
                          responsaveisIds: d.responsaveis?.map(u => u.id) || [],
                          numeroFluig: d.numeroFluig || '',
                        });
                        setDescricao(d.descricao || '');
                        setObservacoes(d.observacoes || []);
                        setEditandoDemandaId(d.id);
                        setShowModal(true);
                      }}>
                        <Edit size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Demanda */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editandoDemandaId ? 'Editar Demanda' : 'Nova Demanda'}</h2>
            {/* Campos do formulário */}
            <input className="input mb-2" placeholder="Nome do Projeto" value={novaDemanda.nomeProjeto || ''} onChange={e => setNovaDemanda({ ...novaDemanda, nomeProjeto: e.target.value })} />
            <div className="flex gap-2 mb-2 items-center">
              <select className="input flex-1" value={novaDemanda.setorId || ''} onChange={e => setNovaDemanda({ ...novaDemanda, setorId: e.target.value })}>
                <option value="">Selecione o Setor</option>
                {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              <button className="btn btn-sm btn-outline" onClick={() => setShowNovoSetor(true)}>Novo Setor</button>
            </div>
            {showNovoSetor && (
              <div className="flex gap-2 mb-2">
                <input className="input flex-1" placeholder="Nome do novo setor" value={novoSetorNome} onChange={e => setNovoSetorNome(e.target.value)} />
                <button className="btn btn-primary" onClick={handleCriarSetor}>Salvar</button>
                <button className="btn btn-secondary" onClick={() => setShowNovoSetor(false)}>Cancelar</button>
              </div>
            )}
            {erroSetor && <div className="text-red-500 text-xs mb-2">{erroSetor}</div>}
            <input className="input mb-2" placeholder="Solicitante" value={novaDemanda.solicitante || ''} onChange={e => setNovaDemanda({ ...novaDemanda, solicitante: e.target.value })} />
            <textarea className="input mb-2" placeholder="Descrição do Projeto" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <input className="input mb-2" placeholder="Link da pasta de projeto" value={novaDemanda.linkPastaProjeto || ''} onChange={e => setNovaDemanda({ ...novaDemanda, linkPastaProjeto: e.target.value })} />
            <input className="input mb-2" placeholder="Link do site" value={novaDemanda.linkSite || ''} onChange={e => setNovaDemanda({ ...novaDemanda, linkSite: e.target.value })} />
            <input className="input mb-2" placeholder="Número Fluig" value={novaDemanda.numeroFluig || ''} onChange={e => setNovaDemanda({ ...novaDemanda, numeroFluig: e.target.value })} />
            <select className="input mb-2" value={novaDemanda.prioridade || ''} onChange={e => setNovaDemanda({ ...novaDemanda, prioridade: e.target.value })}>
              <option value="">Prioridade</option>
              <option value="ALTA" style={{ color: '#dc2626', fontWeight: 'bold', background: '#fee2e2' }}>Alta</option>
              <option value="MEDIA" style={{ color: '#ca8a04', fontWeight: 'bold', background: '#fef9c3' }}>Média</option>
              <option value="BAIXA" style={{ color: '#16a34a', fontWeight: 'bold', background: '#dcfce7' }}>Baixa</option>
            </select>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrega</label>
            <input className="input mb-2" type="date" value={novaDemanda.dataEntrega || ''} onChange={e => setNovaDemanda({ ...novaDemanda, dataEntrega: e.target.value })} />
            <select className="input mb-2" value={novaDemanda.status || 'ABERTO'} onChange={e => setNovaDemanda({ ...novaDemanda, status: e.target.value })}>
              <option value="ABERTO">Aberto</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="PAUSADO">Pausado</option>
            </select>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações Iniciais</label>
              {observacoes.map((obs, idx) => (
                <div key={idx} className="flex gap-2 mb-1 items-center">
                  <textarea className="input flex-1" placeholder="Observação" value={obs.texto} onChange={e => handleObservacaoChange(idx, e.target.value)} />
                  <span className="text-xs text-gray-500">{new Date(obs.data).toLocaleDateString()}</span>
                </div>
              ))}
              <button className="btn btn-sm btn-outline mt-1" onClick={handleAdicionarObservacao}>Adicionar Observação</button>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsáveis (quem executa)</label>
            <select
              className="input mb-2"
              multiple
              value={novaDemanda.responsaveisIds || []}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                setNovaDemanda({ ...novaDemanda, responsaveisIds: options });
              }}
            >
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.nome}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={handleCriarDemanda}>Salvar</button>
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditandoDemandaId(null); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {detalhe && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl relative animate-fade-in max-h-screen overflow-y-auto">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={() => setDetalhe(null)}><XCircle size={28}/></button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700"><Eye size={24}/> Detalhes da Demanda</h2>
            
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div><span className="font-semibold text-gray-700">Projeto:</span> <span className="text-gray-900">{detalhe.nomeProjeto}</span></div>
                <div><span className="font-semibold text-gray-700">Nº Solicitação:</span> <span className="font-mono text-blue-700">{detalhe.solicitacao}</span></div>
                <div><span className="font-semibold text-gray-700">Setor:</span> <span className="text-gray-900">{detalhe.setor?.nome}</span></div>
                <div><span className="font-semibold text-gray-700">Solicitante:</span> <span className="text-gray-900">{detalhe.solicitante}</span></div>
                <div><span className="font-semibold text-gray-700">Criada em:</span> <span className="text-gray-900">{new Date(detalhe.dataAbertura).toLocaleString('pt-BR')}</span></div>
                {detalhe.numeroFluig && <div><span className="font-semibold text-gray-700">Número Fluig:</span> <span className="font-mono text-green-700">{detalhe.numeroFluig}</span></div>}
              </div>
              <div className="space-y-3">
                <div><span className="font-semibold text-gray-700">Prioridade:</span> <span className={`px-2 py-1 rounded ${prioridadeColors[detalhe.prioridade]}`}>{detalhe.prioridade}</span></div>
                <div><span className="font-semibold text-gray-700">Status:</span> <span className={`px-2 py-1 rounded ${statusColors[detalhe.status]}`}>{detalhe.status.replace('_', ' ')}</span></div>
                <div><span className="font-semibold text-gray-700">Data de Entrega:</span> <span className="text-gray-900">{detalhe.dataEntrega ? new Date(detalhe.dataEntrega).toLocaleDateString('pt-BR') : '-'}</span></div>
                {detalhe.dataTermino && <div><span className="font-semibold text-gray-700">Data de Término:</span> <span className="text-gray-900">{new Date(detalhe.dataTermino).toLocaleDateString('pt-BR')}</span></div>}
                <div><span className="font-semibold text-gray-700">Responsáveis:</span> <span className="text-gray-900">{detalhe.responsaveis?.map(u => u.name || u.nome).join(', ') || '-'}</span></div>
              </div>
            </div>

            {/* Descrição */}
            {detalhe.descricao && (
              <div className="mb-6">
                <span className="font-semibold text-gray-700 block mb-2">Descrição:</span>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-800 whitespace-pre-wrap">{detalhe.descricao}</p>
                </div>
              </div>
            )}

            {/* Links */}
            {(detalhe.linkPastaProjeto || detalhe.linkSite) && (
              <div className="mb-6">
                <span className="font-semibold text-gray-700 block mb-2">Links:</span>
                <div className="space-y-2">
                  {detalhe.linkPastaProjeto && (
                    <div><span className="font-medium text-gray-600">Pasta do Projeto:</span> <a href={detalhe.linkPastaProjeto} className="text-blue-600 hover:text-blue-800 underline ml-2" target="_blank" rel="noopener noreferrer">Abrir pasta</a></div>
                  )}
                  {detalhe.linkSite && (
                    <div><span className="font-medium text-gray-600">Site:</span> <a href={detalhe.linkSite} className="text-blue-600 hover:text-blue-800 underline ml-2" target="_blank" rel="noopener noreferrer">Abrir site</a></div>
                  )}
                </div>
              </div>
            )}

            {/* Observações */}
            {detalhe.observacoes?.length > 0 && (
              <div className="mb-6">
                <span className="font-semibold text-gray-700 block mb-2">Observações:</span>
                <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                  {detalhe.observacoes.map((obs, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <div className="text-xs text-gray-500 mb-1">{new Date(obs.data).toLocaleString('pt-BR')} - {obs.autor?.name || obs.autor?.nome || 'Usuário'}</div>
                      <p className="text-gray-800">{obs.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button className="btn btn-danger flex items-center gap-2" title="Excluir Demanda" onClick={handleExcluirDemanda}>
                <Trash2 size={18}/>Excluir
              </button>
              <button className="btn btn-secondary" onClick={() => setDetalhe(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 