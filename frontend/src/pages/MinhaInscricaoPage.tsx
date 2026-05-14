import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inscricaoApi } from '../utils/api';
import { useAuthStore } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface MinhaInscricao {
  id: string;
  nomeReceita: string;
  descricao: string;
  modoPreparo?: string;
  hashInscricao?: string;
  dataConfirmacao?: string;
  fotoReceita?: string;
  status: 'Pendente' | 'Habilitada' | 'Eliminada' | 'ConvocadoSegundaFase';
  motivoEliminacao?: string;
  dataSegundaFase?: string;
  localSegundaFase?: string;
  convocadoEm?: string;
  ingredientes: Array<{ id: number; nome: string; isInNatura: boolean; quantidade?: string }>;
  criadaEm: string;
}

export function MinhaInscricaoPage() {
  const { nome, logout } = useAuthStore();
  const navigate = useNavigate();
  const [inscricao, setInscricao] = useState<MinhaInscricao | null>(null);
  const [loading, setLoading] = useState(true);
  const [semInscricao, setSemInscricao] = useState(false);

  useEffect(() => {
    inscricaoApi.minha()
      .then(r => setInscricao(r.data))
      .catch(e => {
        if (e.response?.status === 404) setSemInscricao(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatarData = (data: string) =>
    new Date(data).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const statusConfig = {
    Pendente: {
      cor: 'bg-yellow-50 border-yellow-300',
      badge: 'bg-yellow-100 text-yellow-800',
      icone: '⏳',
      titulo: 'Inscrição em Análise',
      descricao: 'Sua inscrição foi recebida e está sendo analisada pela equipe FAETEC.'
    },
    Habilitada: {
      cor: 'bg-green-50 border-green-300',
      badge: 'bg-green-100 text-green-800',
      icone: '✅',
      titulo: 'Inscrição Habilitada',
      descricao: 'Sua inscrição foi aprovada na análise técnica! Aguarde o resultado da fase classificatória.'
    },
    Eliminada: {
      cor: 'bg-red-50 border-red-300',
      badge: 'bg-red-100 text-red-800',
      icone: '❌',
      titulo: 'Inscrição Eliminada',
      descricao: 'Infelizmente sua inscrição foi eliminada na análise técnica.'
    },
    ConvocadoSegundaFase: {
      cor: 'bg-orange-50 border-orange-400',
      badge: 'bg-orange-100 text-orange-800',
      icone: '🏆',
      titulo: 'Parabéns! Convocado para a 2ª Fase!',
      descricao: 'Sua receita foi selecionada entre as 12 melhores! Você está convocado para a etapa presencial.'
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="MerendaChef" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-orange-700">MerendaChef</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">Olá, {nome}</span>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-sm text-gray-500 hover:text-gray-700">Sair</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-800 mb-1 text-center">Minha Inscrição</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Concurso Culinário FAETEC 2026</p>

        {loading && <div className="text-center py-12 text-gray-500">Carregando...</div>}

        {semInscricao && !loading && (
          <div className="bg-white rounded-2xl shadow p-8 text-center border border-orange-100">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Você ainda não se inscreveu</h2>
            <p className="text-gray-500 mb-6">Participe do concurso enviando sua receita!</p>
            <button onClick={() => navigate('/inscricao')}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">
              Fazer Inscrição
            </button>
          </div>
        )}

        {inscricao && !loading && (() => {
          const config = statusConfig[inscricao.status];
          return (
            <div className="space-y-4">

              {/* Status */}
              <div className={`rounded-2xl border-2 p-6 ${config.cor}`}>
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{config.icone}</span>
                  <div className="flex-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.badge}`}>
                      {inscricao.status === 'ConvocadoSegundaFase' ? '2ª FASE' : inscricao.status.toUpperCase()}
                    </span>
                    <h2 className="text-lg font-bold text-gray-800 mt-1">{config.titulo}</h2>
                    <p className="text-sm text-gray-600 mt-1">{config.descricao}</p>
                    {inscricao.motivoEliminacao && (
                      <p className="text-sm text-red-700 mt-2 font-medium">
                        Motivo: {inscricao.motivoEliminacao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Detalhes da 2ª fase */}
                {inscricao.status === 'ConvocadoSegundaFase' && (
                  <div className="mt-4 bg-white rounded-xl p-4 border border-orange-200 space-y-3">
                    <h3 className="font-bold text-orange-800 text-sm uppercase tracking-wide">
                      📋 Detalhes da Etapa Presencial
                    </h3>
                    {inscricao.dataSegundaFase && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-2xl">📅</span>
                        <div>
                          <p className="text-gray-500 text-xs">Data e Horário</p>
                          <p className="font-bold text-gray-800">{formatarData(inscricao.dataSegundaFase)}</p>
                        </div>
                      </div>
                    )}
                    {inscricao.localSegundaFase && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-2xl">📍</span>
                        <div>
                          <p className="text-gray-500 text-xs">Local</p>
                          <p className="font-bold text-gray-800">{inscricao.localSegundaFase}</p>
                        </div>
                      </div>
                    )}
                    {inscricao.convocadoEm && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-2xl">🔔</span>
                        <div>
                          <p className="text-gray-500 text-xs">Convocado em</p>
                          <p className="font-medium text-gray-700">{formatarData(inscricao.convocadoEm)}</p>
                        </div>
                      </div>
                    )}
                    <div className="bg-orange-50 rounded-lg p-3 text-xs text-orange-800 border border-orange-200">
                      ⚠️ Compareça com <strong>no mínimo 30 minutos de antecedência</strong> munido de documento de identidade com foto.
                    </div>
                  </div>
                )}
              </div>

              {/* Comprovante de inscrição */}
              {inscricao.hashInscricao && (
                <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3">🔑 Comprovante de Inscrição</h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-center border">
                    <p className="text-xs text-gray-500 mb-1">Código de Verificação</p>
                    <p className="text-2xl font-black tracking-widest text-orange-600">{inscricao.hashInscricao}</p>
                    {inscricao.dataConfirmacao && (
                      <p className="text-xs text-gray-400 mt-2">
                        Confirmado em {formatarData(inscricao.dataConfirmacao)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Guarde este código — poderá ser solicitado para comprovar sua inscrição.
                  </p>
                </div>
              )}

              {/* Receita */}
              <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">🍽️ Sua Receita</h3>
                {inscricao.fotoReceita && (
                  <img src={`${API_URL}/uploads/${inscricao.fotoReceita}`}
                    alt="Foto da receita"
                    className="w-full h-48 object-cover rounded-xl mb-4 border" />
                )}
                <h4 className="text-lg font-bold text-gray-800">{inscricao.nomeReceita}</h4>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{inscricao.descricao}</p>
                {inscricao.modoPreparo && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Modo de Preparo</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                      {inscricao.modoPreparo}
                    </p>
                  </div>
                )}
              </div>

              {/* Ingredientes com quantidade */}
              <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3">
                  🥕 Ingredientes ({inscricao.ingredientes.length})
                </h3>
                <div className="space-y-2">
                  {inscricao.ingredientes.map(i => (
                    <div key={i.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border
                      ${i.isInNatura ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <span className={i.isInNatura ? 'text-green-700 font-medium' : 'text-gray-700'}>
                          {i.nome}
                        </span>
                        {i.isInNatura && (
                          <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded">
                            In Natura
                          </span>
                        )}
                      </div>
                      {i.quantidade && (
                        <span className="text-xs text-gray-500 font-medium">{i.quantidade}</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-2">🌿 Verde = Alimento In Natura (PNAE)</p>
              </div>

              <p className="text-center text-xs text-gray-400">
                Inscrição realizada em {new Date(inscricao.criadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
