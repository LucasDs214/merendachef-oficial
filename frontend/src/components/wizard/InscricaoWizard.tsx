import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { inscricaoApi } from '../../utils/api';
import type { WizardData, Ingrediente } from '../../types';

const STEPS = [
  'Dados Funcionais',
  'Documentação',
  'Receita',
  'Ingredientes',
  'Termos',
];

const UNIDADES_FAETEC = [
  'FAETEC - Sede Central',
  'ETEc Ferreira Viana',
  'ETEc Oscar Tenório',
  'ETEc República',
  'ETEc João Barcelos Martins',
  'ETEc Henrique Lage',
  'ETEc Nilo Peçanha',
  'ETEc Orsina da Fonseca',
  'ETEc Adolpho Bloch',
  'Outro',
];

interface Props {
  ingredientes: Ingrediente[];
}

export function InscricaoWizard({ ingredientes }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<WizardData>({
    unidadeEscolar: '', nomeDiretor: '', matricula: '', cargo: '',
    comprovanteVinculo: null,
    nomeReceita: '', descricao: '', fotoReceita: null,
    ingredienteIds: [],
    aceitouLgpd: false, autorizouUsoImagem: false,
  });

  const update = (field: keyof WizardData, value: unknown) =>
    setData(prev => ({ ...prev, [field]: value }));

  const nextStep = () => { setError(''); setStep(s => s + 1); };
  const prevStep = () => { setError(''); setStep(s => s - 1); };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!data.unidadeEscolar || !data.nomeDiretor || !data.matricula || !data.cargo) {
        setError('Preencha todos os campos obrigatórios.'); return false;
      }
    }
    if (step === 1 && !data.comprovanteVinculo) {
      setError('O comprovante de vínculo funcional é obrigatório.'); return false;
    }
    if (step === 2) {
      if (!data.nomeReceita || !data.descricao) {
        setError('Preencha o nome e a descrição da receita.'); return false;
      }
    }
    if (step === 3 && data.ingredienteIds.length < 3) {
      setError('Selecione ao menos 3 ingredientes.'); return false;
    }
    if (step === 4 && (!data.aceitouLgpd || !data.autorizouUsoImagem)) {
      setError('Você deve aceitar todos os termos para prosseguir.'); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) formData.append(key, value);
        else if (Array.isArray(value)) value.forEach(v => formData.append('ingredienteIds', String(v)));
        else if (value !== null) formData.append(key, String(value));
      });
      await inscricaoApi.enviar(formData);
      navigate('/minha-inscricao');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Erro ao enviar inscrição.');
    } finally {
      setLoading(false);
    }
  };

  const categorias = [...new Set(ingredientes.map(i => i.categoria))].sort();
  const toggleIngrediente = (id: number) => {
    update('ingredienteIds',
      data.ingredienteIds.includes(id)
        ? data.ingredienteIds.filter(i => i !== id)
        : [...data.ingredienteIds, id]
    );
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

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
        {step === 0 && <StepDados data={data} update={update} />}
        {step === 1 && <StepDocumentacao data={data} update={update} />}
        {step === 2 && <StepReceita data={data} update={update} />}
        {step === 3 && (
          <StepIngredientes
            ingredientes={ingredientes}
            categorias={categorias}
            selected={data.ingredienteIds}
            toggle={toggleIngrediente}
          />
        )}
        {step === 4 && <StepTermos data={data} update={update} />}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={prevStep} className="flex-1 py-3 border-2 border-orange-300 text-orange-700 rounded-xl font-semibold hover:bg-orange-50 transition">
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
    </div>
  );
}

// ── Step Components ─────────────────────────────────────────────

function StepDados({ data, update }: { data: WizardData; update: (k: keyof WizardData, v: unknown) => void }) {
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
      {[
        { field: 'nomeDiretor', label: 'Nome do Diretor(a) *', placeholder: 'Nome completo do diretor' },
        { field: 'matricula', label: 'Matrícula Funcional *', placeholder: 'Ex: 12345678' },
        { field: 'cargo', label: 'Cargo *', placeholder: 'Ex: Merendeira, Auxiliar de Serviços...' },
      ].map(({ field, label, placeholder }) => (
        <div key={field}>
          <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
          <input type="text" placeholder={placeholder}
            value={data[field as keyof WizardData] as string}
            onChange={e => update(field as keyof WizardData, e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
      ))}
    </div>
  );
}

function FileDropzone({ label, accept, value, onChange, hint }: {
  label: string; accept: Record<string, string[]>; value: File | null;
  onChange: (f: File | null) => void; hint?: string;
}) {
  const onDrop = useCallback((files: File[]) => { if (files[0]) onChange(files[0]); }, [onChange]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, maxFiles: 1 });
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
        ${isDragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50/50'}`}>
        <input {...getInputProps()} />
        {value ? (
          <div className="text-green-600 font-medium">✅ {value.name}</div>
        ) : (
          <div className="text-gray-500">
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm">{isDragActive ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}</p>
            {hint && <p className="text-xs mt-1 text-gray-400">{hint}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function StepDocumentacao({ data, update }: { data: WizardData; update: (k: keyof WizardData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">📄 Documentação</h2>
      <p className="text-sm text-gray-600">Envie o comprovante que comprova seu vínculo funcional com a unidade FAETEC.</p>
      <FileDropzone
        label="Comprovante de Vínculo Funcional *"
        accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }}
        value={data.comprovanteVinculo}
        onChange={f => update('comprovanteVinculo', f)}
        hint="PDF, JPG ou PNG — máx. 10MB"
      />
    </div>
  );
}

function StepReceita({ data, update }: { data: WizardData; update: (k: keyof WizardData, v: unknown) => void }) {
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
        <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição Detalhada *</label>
        <textarea rows={5} placeholder="Descreva o modo de preparo, origem cultural, técnicas especiais..."
          value={data.descricao} onChange={e => update('descricao', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
        <p className="text-xs text-gray-400 mt-1">{data.descricao.length} caracteres</p>
      </div>
      <FileDropzone
        label="Foto do Prato (opcional)"
        accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }}
        value={data.fotoReceita}
        onChange={f => update('fotoReceita', f)}
        hint="JPG ou PNG — máx. 5MB"
      />
    </div>
  );
}

function StepIngredientes({ ingredientes, categorias, selected, toggle }: {
  ingredientes: Ingrediente[]; categorias: string[];
  selected: number[]; toggle: (id: number) => void;
}) {
  const [busca, setBusca] = useState('');
  const filtered = ingredientes.filter(i =>
    i.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">🥕 Ingredientes (Anexo I)</h2>
      <p className="text-sm text-gray-600">
        Selecione apenas os ingredientes do pregão FAETEC. Mín. 3 ingredientes.
        <span className="ml-1 text-orange-600 font-semibold">({selected.length} selecionados)</span>
      </p>
      <input type="text" placeholder="🔍 Buscar ingrediente..." value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
      <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
        {categorias.map(cat => {
          const items = filtered.filter(i => i.categoria === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white py-1">{cat}</h3>
              <div className="grid grid-cols-1 gap-1">
                {items.map(ing => (
                  <label key={ing.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition
                      ${selected.includes(ing.id) ? 'bg-orange-50 border border-orange-300' : 'hover:bg-gray-50 border border-transparent'}`}>
                    <input type="checkbox" checked={selected.includes(ing.id)} onChange={() => toggle(ing.id)}
                      className="accent-orange-500 w-4 h-4" />
                    <span className="flex-1 text-sm text-gray-800">{ing.nome}</span>
                    <span className="text-xs text-gray-400">{ing.unidadeMedida}</span>
                    {ing.isInNatura && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">In Natura</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepTermos({ data, update }: { data: WizardData; update: (k: keyof WizardData, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">📜 Termos e Autorização</h2>
      <div className="space-y-4">
        <label className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition
          ${data.aceitouLgpd ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
          <input type="checkbox" checked={data.aceitouLgpd} onChange={e => update('aceitouLgpd', e.target.checked)}
            className="accent-orange-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Termo de Uso e LGPD *</p>
            <p className="text-sm text-gray-600 mt-1">
              Declaro que li e concordo com os termos de uso do sistema MerendaChef e autorizo
              o tratamento dos meus dados pessoais pela rede FAETEC conforme a Lei nº 13.709/2018 (LGPD),
              para fins exclusivos deste concurso culinário.
            </p>
          </div>
        </label>
        <label className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition
          ${data.autorizouUsoImagem ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
          <input type="checkbox" checked={data.autorizouUsoImagem} onChange={e => update('autorizouUsoImagem', e.target.checked)}
            className="accent-orange-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Autorização de Uso de Imagem *</p>
            <p className="text-sm text-gray-600 mt-1">
              Autorizo a FAETEC a utilizar minha imagem, nome, receita e demais informações
              submetidas neste concurso para fins institucionais, comunicação e divulgação
              nos canais oficiais da rede, sem ônus.
            </p>
          </div>
        </label>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        ⚠️ <strong>Atenção:</strong> Após o envio, a inscrição não poderá ser alterada.
        Verifique todas as informações antes de confirmar.
      </div>
    </div>
  );
}
