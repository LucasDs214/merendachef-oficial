import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inscricaoApi } from '../utils/api';
import { useAuthStore } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface MinhaInscricao {
  id: string;
  nomeReceita: string;
  descricao: string;
  fotoReceita?: string;
  status: 'Pendente' | 'Habilitada' | 'Eliminada' | 'ConvocadoSegundaFase';
  motivoEliminacao?: string;
  dataSegundaFase?: string;
  localSegundaFase?: string;
  convocadoEm?: string;
  ingredientes: Array<{ id: number; nome: string; isInNatura: boolean }>;
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

  const statusConfig = {
    Pendente: {
      cor: 'bg-yellow-50 border-yellow-300',
      badge: 'bg-yellow-100 text-yellow-800',
      icone: '⏳',
      titulo: 'Inscrição em Análise',
      descricao: 'Sua inscrição foi recebida e está sendo analisada pela equipe FAETEC. Você será notificado sobre o resultado.'
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
          <span className="text-2xl">🍳</span>
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
        <p className="text-center text-gray-500 text-sm mb-6">Concurso Culinário FAETEC 2025</p>

        {loading && (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        )}

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

              {/* Card de Status */}
              <div className={`rounded-2xl border-2 p-6 ${config.cor}`}>
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{config.icone}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.badge}`}>
                        {inscricao.status === 'ConvocadoSegundaFase' ? '2ª FASE' : inscricao.status.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">{config.titulo}</h2>
                    <p className="text-sm text-gray-600 mt-1">{config.descricao}</p>
                    {inscricao.motivoEliminacao && (
                      <p className="text-sm text-red-700 mt-2 font-medium">
                        Motivo: {inscricao.motivoEliminacao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Detalhes da 2ª fase */}
                {inscricao.status === 'ConvocadoSegundaFase' && inscricao.dataSegundaFase && (
                  <div className="mt-4 bg-white rounded-xl p-4 border border-orange-200 space-y-3">
                    <h3 className="font-bold text-orange-800 text-sm uppercase tracking-wide">
                      📋 Detalhes da Etapa Presencial
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">📅</span>
                      <div>
                        <p className="text-gray-500 text-xs">Data e Horário</p>
                        <p className="font-bold text-gray-800">
                          {new Date(inscricao.dataSegundaFase).toLocaleString('pt-BR', {
                            day: '2-digit', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">📍</span>
                      <div>
                        <p className="text-gray-500 text-xs">Local</p>
                        <p className="font-bold text-gray-800">{inscricao.localSegundaFase}</p>
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-xs text-orange-800 border border-orange-200">
                      ⚠️ Compareça com antecedência munido de documento de identidade. 
                      Um e-mail com estas informações foi enviado para seu endereço cadastrado.
                    </div>
                  </div>
                )}
              </div>

              {/* Card da Receita */}
              <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">🍽️ Sua Receita</h3>
                {inscricao.fotoReceita && (
                  <img src={`${API_URL}/uploads/${inscricao.fotoReceita}`}
                    alt="Foto da receita"
                    className="w-full h-48 object-cover rounded-xl mb-4 border" />
                )}
                <h4 className="text-lg font-bold text-gray-800">{inscricao.nomeReceita}</h4>
                <p className="text-sm text-gray-600 mt-2">{inscricao.descricao}</p>
              </div>

              {/* Card de Ingredientes */}
              <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3">
                  🥕 Ingredientes ({inscricao.ingredientes.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {inscricao.ingredientes.map(i => (
                    <span key={i.id} className={`text-xs px-2 py-1 rounded-full border
                      ${i.isInNatura
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                      {i.nome}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  🌿 Verde = Alimento In Natura
                </p>
              </div>

              <p className="text-center text-xs text-gray-400">
                Inscrição realizada em {new Date(inscricao.criadaEm).toLocaleDateString('pt-BR')}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
