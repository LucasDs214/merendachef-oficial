import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/api';
import type { InscricaoAdmin, RankingItem } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

type Tab = 'inscricoes' | 'ranking';

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('inscricoes');
  const [inscricoes, setInscricoes] = useState<InscricaoAdmin[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<InscricaoAdmin | null>(null);
  const [motivoElim, setMotivoElim] = useState('');
  const [notas, setNotas] = useState({ viabilidade: 0, criatividade: 0, culturaRegional: 0, alimentosInNatura: 0 });

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listar(filtroStatus || undefined);
      setInscricoes(res.data);
    } finally { setLoading(false); }
  };

  const carregarRanking = async () => {
    const res = await adminApi.ranking();
    setRanking(res.data);
  };

  useEffect(() => { carregar(); }, [filtroStatus]);
  useEffect(() => { if (tab === 'ranking') carregarRanking(); }, [tab]);

  const habilitar = async (id: string) => {
    await adminApi.habilitar(id);
    carregar();
    setSelected(null);
  };

  const eliminar = async (id: string) => {
    if (!motivoElim) { alert('Informe o motivo.'); return; }
    await adminApi.eliminar(id, motivoElim);
    setMotivoElim('');
    carregar();
    setSelected(null);
  };

  const lancarNotas = async (id: string) => {
    await adminApi.lancarNotas(id, notas);
    carregar();
    setSelected(null);
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      Pendente: 'bg-yellow-100 text-yellow-800',
      Habilitada: 'bg-green-100 text-green-800',
      Eliminada: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[s] || ''}`}>{s}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-xl">🍳</div>
        <div>
          <h1 className="text-xl font-bold">MerendaChef — Administração</h1>
          <p className="text-blue-200 text-sm">Painel de Gestão do Concurso FAETEC</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {(['inscricoes', 'ranking'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-lg font-semibold transition
                ${tab === t ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-blue-50 border'}`}>
              {t === 'inscricoes' ? '📋 Inscrições' : '🏆 Ranking'}
            </button>
          ))}
        </div>

        {tab === 'inscricoes' && (
          <>
            <div className="flex gap-3 mb-4">
              {['', 'Pendente', 'Habilitada', 'Eliminada'].map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition
                    ${filtroStatus === s ? 'bg-blue-900 text-white' : 'bg-white border hover:bg-gray-50'}`}>
                  {s || 'Todas'} ({inscricoes.filter(i => !s || i.status === s).length})
                </button>
              ))}
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Carregando...</div>
            ) : (
              <div className="grid gap-3">
                {inscricoes.map(insc => (
                  <div key={insc.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
                    onClick={() => { setSelected(insc); setNotas({ viabilidade: insc.notas.viabilidade || 0, criatividade: insc.notas.criatividade || 0, culturaRegional: insc.notas.culturaRegional || 0, alimentosInNatura: insc.notas.alimentosInNatura || 0 }); }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {statusBadge(insc.status)}
                          <span className="font-bold text-gray-800">{insc.receita.nome}</span>
                        </div>
                        <p className="text-sm text-gray-500">{insc.candidato.nome} — {insc.candidato.unidade}</p>
                        <p className="text-xs text-gray-400 mt-1">{insc.ingredientes.length} ingredientes ({insc.ingredientes.filter(i => i.isInNatura).length} in natura)</p>
                      </div>
                      {insc.notas.total && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">{insc.notas.total}</div>
                          <div className="text-xs text-gray-400">pontos</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'ranking' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-900 text-white">
                <tr>
                  {['#', 'Candidato', 'Receita', 'In Natura', 'Viab.', 'Criativ.', 'Regional', 'Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={i} className={`border-t ${r.posicao <= 3 ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 font-bold text-lg">
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : `${r.posicao}º`}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.candidato}</td>
                    <td className="px-4 py-3 text-gray-600">{r.nomeReceita}</td>
                    <td className="px-4 py-3">{r.notas.alimentosInNatura}</td>
                    <td className="px-4 py-3">{r.notas.viabilidade}</td>
                    <td className="px-4 py-3">{r.notas.criatividade}</td>
                    <td className="px-4 py-3">{r.notas.culturaRegional}</td>
                    <td className="px-4 py-3 font-bold text-orange-600">{r.notas.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 overflow-y-auto z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mt-8 mb-8" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Ficha Técnica — {selected.receita.nome}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="font-bold text-gray-700 mb-2">Candidato</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(selected.candidato).map(([k, v]) => (
                    <div key={k}><span className="text-gray-500">{k}:</span> <span className="font-medium">{v}</span></div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-2">Receita</h3>
                <p className="text-sm text-gray-600 mb-3">{selected.receita.descricao}</p>
                {selected.receita.foto && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Foto do Prato</p>
                    <img src={`${API_URL}/uploads/${selected.receita.foto}`} alt="Foto da receita" className="rounded-lg max-h-48 object-cover border" />
                  </div>
                )}
                {selected.receita.comprovante && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Comprovante de Vínculo</p>
                    <a href={`${API_URL}/uploads/${selected.receita.comprovante}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition">
                      📄 Visualizar Comprovante
                    </a>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-2">Ingredientes ({selected.ingredientes.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.ingredientes.map(i => (
                    <span key={i.id} className={`text-xs px-2 py-1 rounded-full border
                      ${i.isInNatura ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                      {i.nome}
                    </span>
                  ))}
                </div>
              </div>

              {selected.status === 'Pendente' && (
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-bold text-gray-700">Habilitação Técnica</h3>
                  <button onClick={() => habilitar(selected.id)}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
                    ✅ Habilitar Inscrição
                  </button>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Motivo da eliminação..."
                      value={motivoElim} onChange={e => setMotivoElim(e.target.value)}
                      className="flex-1 border rounded-lg p-2 text-sm" />
                    <button onClick={() => eliminar(selected.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm">
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              {selected.status === 'Habilitada' && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-700 mb-3">Lançar Notas (0–50 por critério)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'viabilidade', label: 'Viabilidade' },
                      { key: 'criatividade', label: 'Criatividade' },
                      { key: 'culturaRegional', label: 'Cultura Regional' },
                      { key: 'alimentosInNatura', label: 'Alimentos In Natura' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                        <input type="number" min={0} max={50}
                          value={notas[key as keyof typeof notas]}
                          onChange={e => setNotas(n => ({ ...n, [key]: +e.target.value }))}
                          className="w-full border rounded-lg p-2 text-center font-bold" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right text-sm font-bold text-orange-600">
                    Total: {Object.values(notas).reduce((a, b) => a + b, 0)} pontos
                  </div>
                  <button onClick={() => lancarNotas(selected.id)}
                    className="mt-3 w-full py-3 bg-blue-800 text-white rounded-xl font-semibold hover:bg-blue-900">
                    💾 Salvar Notas
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
