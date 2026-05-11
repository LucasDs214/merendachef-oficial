import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { inscricaoApi } from '../../utils/api';
import { maskTelefone } from '../../utils/masks';
import type { WizardData, Ingrediente } from '../../types';

const STEPS = ['Dados Funcionais', 'Documentação', 'Receita', 'Ingredientes', 'Termos'];

const UNIDADES_FAETEC = [
  'Ete João Luiz do Nascimento',
  'Ete Juscelino Kubistschek',
  'Creche Casa da Criança',
  'Ete República',
  'Escola Especial Favo de Mel',
  'Iserj',
  'Ete Ferreira Viana',
  'Ete Imbariê',
  'Marechal Hermes Cozinha Central',
  'Ete Santa Cruz',
  'Fundamental República',
  'Henrique Lage - Barreto',
  'Ete Adolpho Bloch',
];

const TERMOS_TEXTO = `TERMOS DE USO E POLÍTICA DE PRIVACIDADE
Concurso Culinário MerendaChef — FAETEC 2026

1. OBJETO
O presente termo regula a participação no Concurso Culinário MerendaChef, promovido pela Fundação de Apoio à Escola Técnica do Estado do Rio de Janeiro (FAETEC).

2. COLETA DE DADOS (LGPD)
Os dados pessoais coletados (nome, CPF, e-mail, telefone, matrícula) serão utilizados exclusivamente para fins de gestão do concurso, comunicação com os participantes e, mediante autorização expressa, para fins de pesquisa científica e institucional.

3. USO PARA PESQUISA CIENTÍFICA
Ao aceitar este termo, o participante autoriza o uso anonimizado de seus dados e da receita submetida para fins de pesquisa científica, estudos nutricionais e publicações institucionais da FAETEC, garantindo-se a privacidade do indivíduo.

4. USO DE IMAGEM
O participante autoriza a FAETEC a utilizar sua imagem, nome e receita para divulgação institucional nos canais oficiais da rede, sem ônus.

5. ARMAZENAMENTO
Os dados serão armazenados de forma segura pelo período necessário à realização do concurso e por até 5 anos para fins de auditoria, conforme exige a legislação vigente.

6. DIREITOS DO TITULAR
O participante poderá solicitar acesso, correção ou exclusão de seus dados a qualquer momento, mediante contato com a FAETEC.

7. CONTATO
Para dúvidas: merendachef@faetec.rj.gov.br`;

interface Props {
  ingredientes: Ingrediente[];
}

export function InscricaoWizard({ ingredientes }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalTermos, setModalTermos] = useState(false);
  const [data, setData] = useState<WizardData>({
    unidadeEscolar: '', nomeDiretor: '', matricula: '', cargo: '', telefone: '',
    comprovanteVinculo: null,
    nomeReceita: '', descricao: '', modoPreparo: '', fotoReceita: null,
    ingredientes: [],
    aceitouLgpd: false, autorizouUsoImagem: false, aceitouTermosUso: false,
  });

  const update = (field: keyof WizardData, value: unknown) =>
    setData(prev => ({ ...prev, [field]: value }));

  const nextStep = () => { setError(''); setStep(s => s + 1); };
  const prevStep = () => { setError(''); setStep(s => s - 1); };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!data.unidadeEscolar || !data.nomeDiretor || !data.matricula || !data.cargo || !data.telefone) {
        setError('Preencha todos os campos obrigatórios.'); return false;
      }
    }
    if (step === 1 && !data.comprovanteVinculo) {
      setError('O comprovante de vínculo funcional é obrigatório.'); return false;
    }
    if (step === 2) {
      if (!data.nomeReceita || !data.descricao || !data.modoPreparo) {
        setError('Preencha o nome, descrição e modo de preparo da receita.'); return false;
      }
    }
    if (step === 3 && data.ingredientes.length < 3) {
      setError('Selecione ao menos 3 ingredientes.'); return false;
    }
    if (step === 4 && (!data.aceitouLgpd || !data.autorizouUsoImagem || !data.aceitouTermosUso)) {
      setError('Você deve aceitar todos os termos para prosseguir.'); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('unidadeEscolar', data.unidadeEscolar);
      formData.append('nomeDiretor', data.nomeDiretor);
      formData.append('matricula', data.matricula);
      formData.append('cargo', data.cargo);
      formData.append('telefone', data.telefone);
      formData.append('nomeReceita', data.nomeReceita);
      formData.append('descricao', data.descricao);
      formData.append('modoPreparo', data.modoPreparo);
      formData.append('aceitouLgpd', String(data.aceitouLgpd));
      formData.append('autorizouUsoImagem', String(data.autorizouUsoImagem));
      formData.append('aceitouTermosUso', String(data.aceitouTermosUso));
      if (data.comprovanteVinculo) formData.append('comprovanteVinculo', data.comprovanteVinculo);
      if (data.fotoReceita) formData.append('fotoReceita', data.fotoReceita);

      // Ingredientes com quantidade
      data.ingredientes.forEach((ing, index) => {
        formData.append(`Ingredientes[${index}].Id`, String(ing.id));
        formData.append(`Ingredientes[${index}].Quantidade`, ing.quantidade);
      });

      await inscricaoApi.enviar(formData);
      navigate('/minha-inscricao');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Erro ao enviar inscrição.');
    } finally { setLoading(false); }
  };

  const categorias = [...new Set(ingredientes.map(i => i.categoria))].sort();

  const toggleIngrediente = (id: number) => {
    const existe = data.ingredientes.find(i => i.id === id);
    if (existe) {
      update('ingredientes', data.ingredientes.filter(i => i.id !== id));
    } else {
      update('ingredientes', [...data.ingredientes, { id, quantidade: '' }]);
    }
  };

  const updateQuantidade = (id: number, quantidade: string) => {
    update('ingredientes', data.ingredientes.map(i => i.id === id ? { ...i, quantidade } : i));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${i < step ? 'bg-orange-500 text-white' :
                  i === step ? 'bg-orange-600 text-white ring-4 ring-orange-200' :
                  'bg-gray-200 text-gray-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-1 rounded ${i < step ? 'bg-orange-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-orange-700 mt-2">
          Passo {step + 1} de {STEPS.length}: <span className="font-bold">{STEPS[step]}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
        {step === 0 && <StepDados data={data} update={update} />}
        {step === 1 && <StepDocumentacao data={data} update={update} />}
        {step === 2 && <StepReceita data={data} update={update} />}
        {step === 3 && (
          <StepIngredientes
            ingredientes={ingredientes}
            categorias={categorias}
            selected={data.ingredientes}
            toggle={toggleIngrediente}
            updateQuantidade={updateQuantidade}
          />
        )}
        {step === 4 && (
          <StepTermos
            data={data}
            update={update}
            onAbrirTermos={() => setModalTermos(true)}
          />
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={prevStep}
              className="flex-1 py-3 border-2 border-orange-300 text-orange-700 rounded-xl font-semibold hover:bg-orange-50 transition">
              ← Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => { if (validateStep()) nextStep(); }}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition shadow">
              Próximo →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition shadow disabled:opacity-50">
              {loading ? 'Enviando...' : '🏆 Enviar Inscrição'}
            </button>
          )}
        </div>
      </div>

      {/* Modal Termos */}
      {modalTermos && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setModalTermos(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">📜 Termos de Uso e Política de Privacidade</h2>
              <button onClick={() => setModalTermos(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{TERMOS_TEXTO}</pre>
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setModalTermos(false)}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Passo 1 ────────────────────────────────────────────────────
function StepDados({ data, update }: {
  data: WizardData;
  update: (k: keyof WizardData, v: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">📋 Dados Funcionais</h2>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Unidade Escolar (FAETEC) *</label>
        <select value={data.unidadeEscolar} onChange={e => update('unidadeEscolar', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none">
          <option value="">Selecione...</option>
          {UNIDADES_FAETEC.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do(a) Diretor(a) *</label>
        <input type="text" placeholder="Nome completo do(a) diretor(a)"
          value={data.nomeDiretor} onChange={e => update('nomeDiretor', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
          Matrícula do Funcionário *
          <span className="group relative cursor-help inline-block ml-1">
            <span className="text-gray-400 text-xs border border-gray-300 rounded-full w-4 h-4 inline-flex items-center justify-center">?</span>
            <span className="hidden group-hover:block absolute left-6 top-0 bg-gray-800 text-white text-xs rounded-lg p-2 w-52 z-10">
              Número de matrícula funcional fornecido pela FAETEC no momento da contratação.
            </span>
          </span>
        </label>
        <input type="text" placeholder="Ex: 12345678"
          value={data.matricula} onChange={e => update('matricula', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Cargo *</label>
        <input type="text" placeholder="Ex: Merendeira, Auxiliar de Serviços..."
          value={data.cargo} onChange={e => update('cargo', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone / WhatsApp *</label>
        <input type="text" placeholder="(21) 99999-9999"
          value={data.telefone}
          onChange={e => update('telefone', maskTelefone(e.target.value))}
          maxLength={15}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
      </div>
    </div>
  );
}

// ── Passo 2 ────────────────────────────────────────────────────
function FileDropzone({ label, accept, value, onChange, hint }: {
  label: string;
  accept: string;
  value: File | null;
  onChange: (f: File | null) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <label className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition block
        border-gray-300 hover:border-orange-300 hover:bg-orange-50/50">
        <input type="file" accept={accept} className="hidden"
          onChange={e => onChange(e.target.files?.[0] || null)} />
        {value ? (
          <div className="text-green-600 font-medium">✅ {value.name}</div>
        ) : (
          <div className="text-gray-500">
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm">Clique para selecionar o arquivo</p>
            {hint && <p className="text-xs mt-1 text-gray-400">{hint}</p>}
          </div>
        )}
      </label>
    </div>
  );
}

function StepDocumentacao({ data, update }: {
  data: WizardData;
  update: (k: keyof WizardData, v: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">📄 Documentação</h2>
      <p className="text-sm text-gray-600">Envie o documento que comprova seu vínculo funcional com a unidade FAETEC.</p>
      <FileDropzone
        label="Comprovante de Vínculo Funcional *"
        accept=".pdf,.jpg,.jpeg,.png"
        value={data.comprovanteVinculo}
        onChange={f => update('comprovanteVinculo', f)}
        hint="PDF, JPG ou PNG — máx. 10MB"
      />
    </div>
  );
}

// ── Passo 3 ────────────────────────────────────────────────────
function StepReceita({ data, update }: {
  data: WizardData;
  update: (k: keyof WizardData, v: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">🍽️ Sua Receita</h2>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Receita *</label>
        <input type="text" placeholder="Ex: Feijoada Carioca da Vovó"
          value={data.nomeReceita} onChange={e => update('nomeReceita', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição do Prato *</label>
        <p className="text-xs text-gray-400 mb-1">
          Descreva o prato, sua origem cultural e, se quiser, inclua curiosidades sobre a receita ou tradições familiares.
        </p>
        <textarea rows={4} placeholder="Descreva seu prato, origem cultural, curiosidades..."
          value={data.descricao} onChange={e => update('descricao', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Modo de Preparo *</label>
        <textarea rows={6} placeholder="Descreva passo a passo como preparar a receita, incluindo técnicas, temperaturas e tempos de cozimento..."
          value={data.modoPreparo} onChange={e => update('modoPreparo', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
        <p className="text-xs text-gray-400 mt-1">{data.modoPreparo.length} caracteres</p>
      </div>
      <FileDropzone
        label="Foto do Prato (opcional)"
        accept=".jpg,.jpeg,.png"
        value={data.fotoReceita}
        onChange={f => update('fotoReceita', f)}
        hint="JPG ou PNG — máx. 5MB"
      />
    </div>
  );
}

// ── Passo 4 ────────────────────────────────────────────────────
function StepIngredientes({ ingredientes, categorias, selected, toggle, updateQuantidade }: {
  ingredientes: Ingrediente[];
  categorias: string[];
  selected: { id: number; quantidade: string }[];
  toggle: (id: number) => void;
  updateQuantidade: (id: number, quantidade: string) => void;
}) {
  const [busca, setBusca] = useState('');
  const filtered = ingredientes.filter(i =>
    i.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">🥕 Ingredientes (Anexo I)</h2>
      <p className="text-sm text-gray-600">
        Selecione os ingredientes do pregão FAETEC e informe a quantidade de cada um.
        <span className="ml-1 text-orange-600 font-semibold">({selected.length} selecionados — mín. 3)</span>
      </p>
      <input type="text" placeholder="🔍 Buscar ingrediente..." value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />

      {/* Ingredientes selecionados com quantidade */}
      {selected.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-orange-700 mb-2">✅ Ingredientes selecionados — informe a quantidade:</p>
          {selected.map(sel => {
            const ing = ingredientes.find(i => i.id === sel.id);
            if (!ing) return null;
            return (
              <div key={sel.id} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-gray-800 font-medium">{ing.nome}</span>
                <input
                  type="text"
                  placeholder={`Qtd (${ing.unidadeMedida})`}
                  value={sel.quantidade}
                  onChange={e => updateQuantidade(sel.id, e.target.value)}
                  className="w-32 border border-orange-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
                <button onClick={() => toggle(sel.id)}
                  className="text-red-400 hover:text-red-600 text-lg leading-none">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de ingredientes */}
      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {categorias.map(cat => {
          const items = filtered.filter(i => i.categoria === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white py-1">{cat}</h3>
              <div className="grid gap-1">
                {items.map(ing => {
                  const isSelected = selected.some(s => s.id === ing.id);
                  return (
                    <label key={ing.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition
                        ${isSelected ? 'bg-orange-50 border border-orange-300' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(ing.id)}
                        className="accent-orange-500 w-4 h-4" />
                      <span className="flex-1 text-sm text-gray-800">{ing.nome}</span>
                      <span className="text-xs text-gray-400">{ing.unidadeMedida}</span>
                      {ing.isInNatura && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">In Natura</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Passo 5 ────────────────────────────────────────────────────
function StepTermos({ data, update, onAbrirTermos }: {
  data: WizardData;
  update: (k: keyof WizardData, v: unknown) => void;
  onAbrirTermos: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">📜 Termos e Autorização</h2>
      <div className="space-y-3">
        <label className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition
          ${data.aceitouLgpd ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
          <input type="checkbox" checked={data.aceitouLgpd}
            onChange={e => update('aceitouLgpd', e.target.checked)}
            className="accent-orange-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Termo de Uso e LGPD *</p>
            <p className="text-sm text-gray-600 mt-1">
              Declaro que li e concordo com os termos de uso e autorizo o tratamento dos meus dados pessoais pela FAETEC conforme a Lei nº 13.709/2018 (LGPD), para fins exclusivos deste concurso culinário.
            </p>
          </div>
        </label>

        <label className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition
          ${data.autorizouUsoImagem ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
          <input type="checkbox" checked={data.autorizouUsoImagem}
            onChange={e => update('autorizouUsoImagem', e.target.checked)}
            className="accent-orange-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Autorização de Uso de Imagem *</p>
            <p className="text-sm text-gray-600 mt-1">
              Autorizo a FAETEC a utilizar minha imagem, nome, receita e demais informações submetidas neste concurso para fins institucionais e divulgação nos canais oficiais da rede, sem ônus.
            </p>
          </div>
        </label>

        <label className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition
          ${data.aceitouTermosUso ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
          <input type="checkbox" checked={data.aceitouTermosUso}
            onChange={e => update('aceitouTermosUso', e.target.checked)}
            className="accent-orange-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Termos de Uso Completos *</p>
            <p className="text-sm text-gray-600 mt-1">
              Li e aceito os{' '}
              <button type="button"
                onClick={e => { e.preventDefault(); onAbrirTermos(); }}
                className="text-orange-600 underline font-semibold hover:text-orange-700">
                Termos de Uso completos
              </button>
              {' '}e autorizo o uso anonimizado dos meus dados e receita para fins de pesquisa científica e estudos nutricionais da FAETEC.
            </p>
          </div>
        </label>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        ⚠️ <strong>Atenção:</strong> Após o envio, a inscrição não poderá ser alterada. Verifique todas as informações antes de confirmar.
      </div>
    </div>
  );
}
