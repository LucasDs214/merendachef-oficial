import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuth';
import { authApi, inscricaoApi } from './utils/api';
import { InscricaoWizard } from './components/wizard/InscricaoWizard';
import { AdminPanel } from './components/admin/AdminPanel';
import { MinhaInscricaoPage } from './pages/MinhaInscricaoPage';
import { maskCpf } from './utils/masks';
import type { Ingrediente } from './types';

// ── Eye Icon ───────────────────────────────────────────────────
function EyeIcon({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button type="button" onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
      {show ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

// ── Password Input ─────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, className }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        required
      />
      <EyeIcon show={show} toggle={() => setShow(s => !s)} />
    </div>
  );
}

// ── Auth Guard ─────────────────────────────────────────────────
function PrivateRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { token, role: userRole } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── Login Page ─────────────────────────────────────────────────
function LoginPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [mode, setMode] = useState<'login' | 'registro' | 'reset'>('login');
  const [regData, setRegData] = useState({ nome: '', cpf: '', email: '' });
  const [resetCpf, setResetCpf] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.login({ cpf: cpf.replace(/\D/g, ''), senha });
      setAuth(res.data.token, res.data.nome, 'candidato', res.data.primeiroAcesso);
      if (res.data.primeiroAcesso) {
        navigate('/trocar-senha');
      } else {
        try {
          await inscricaoApi.minha();
          navigate('/minha-inscricao');
        } catch {
          navigate('/inscricao');
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Erro ao fazer login.');
    } finally { setLoading(false); }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authApi.registrar({ ...regData, cpf: regData.cpf.replace(/\D/g, '') });
      setSucesso('Cadastro realizado! Verifique seu e-mail para a senha temporária.');
      setMode('login');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Erro no cadastro.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authApi.resetSenha(resetCpf.replace(/\D/g, ''));
      setSucesso('Senha resetada! Verifique seu e-mail para a nova senha temporária.');
      setMode('login');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'CPF não encontrado.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-3xl shadow-lg mb-4 text-4xl">
            🍳
          </div>
          <h1 className="text-3xl font-black text-gray-900">MerendaChef</h1>
          <p className="text-orange-600 font-medium mt-1">Concurso Culinário FAETEC 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
          {mode !== 'reset' && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {(['login', 'registro'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSucesso(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition
                    ${mode === m ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </button>
              ))}
            </div>
          )}

          {sucesso && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">✅ {sucesso}</div>}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">⚠️ {error}</div>}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
                <input type="text" placeholder="000.000.000-00"
                  value={cpf}
                  onChange={e => setCpf(maskCpf(e.target.value))}
                  maxLength={14}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
                <PasswordInput value={senha} onChange={e => setSenha(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none pr-10" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50 shadow">
                {loading ? 'Entrando...' : 'Entrar →'}
              </button>
              <button type="button" onClick={() => { setMode('reset'); setError(''); setSucesso(''); }}
                className="w-full text-sm text-orange-500 hover:text-orange-700 text-center mt-1">
                Esqueci minha senha
              </button>
            </form>
          )}

          {mode === 'registro' && (
            <form onSubmit={handleRegistro} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                <input type="text" placeholder="Seu nome completo"
                  value={regData.nome}
                  onChange={e => setRegData(d => ({ ...d, nome: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
                <input type="text" placeholder="000.000.000-00"
                  value={regData.cpf}
                  onChange={e => setRegData(d => ({ ...d, cpf: maskCpf(e.target.value) }))}
                  maxLength={14}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
                <input type="email" placeholder="seu@email.com"
                  value={regData.email}
                  onChange={e => setRegData(d => ({ ...d, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50 shadow">
                {loading ? 'Cadastrando...' : 'Criar Conta'}
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-3xl mb-2">🔑</div>
                <h3 className="font-bold text-gray-800">Resetar Senha</h3>
                <p className="text-sm text-gray-500">Digite seu CPF e enviaremos uma nova senha para seu e-mail.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
                <input type="text" placeholder="000.000.000-00"
                  value={resetCpf}
                  onChange={e => setResetCpf(maskCpf(e.target.value))}
                  maxLength={14}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50">
                {loading ? 'Enviando...' : 'Enviar Nova Senha'}
              </button>
              <button type="button" onClick={() => { setMode('login'); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center">
                ← Voltar ao login
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-4">
          <Link to="/admin/login" className="text-xs text-gray-400 hover:text-gray-600">Acesso Administrativo</Link>
        </div>
      </div>
    </div>
  );
}

// ── Trocar Senha Page ──────────────────────────────────────────
function TrocarSenhaPage() {
  const { nome } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.novaSenha !== form.confirmar) { setError('As senhas não coincidem.'); return; }
    if (form.novaSenha.length < 8) { setError('A nova senha deve ter no mínimo 8 caracteres.'); return; }
    setLoading(true);
    try {
      await authApi.trocarSenha({ senhaAtual: form.senhaAtual, novaSenha: form.novaSenha });
      navigate('/inscricao');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Erro ao trocar senha.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-orange-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔐 Trocar Senha</h2>
        <p className="text-gray-500 text-sm mb-6">Olá, {nome}! Por segurança, crie uma senha pessoal.</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">⚠️ {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'senhaAtual', label: 'Senha Temporária' },
            { key: 'novaSenha', label: 'Nova Senha (mín. 8 caracteres)' },
            { key: 'confirmar', label: 'Confirmar Nova Senha' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <PasswordInput
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none pr-10"
              />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar e Continuar →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Inscricao Page ─────────────────────────────────────────────
function InscricaoPage() {
  const { nome, logout } = useAuthStore();
  const navigate = useNavigate();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);

  useEffect(() => {
    inscricaoApi.ingredientes().then(r => setIngredientes(r.data));
  }, []);

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
      <div className="py-4">
        <h1 className="text-center text-2xl font-black text-gray-800 mb-1">Minha Inscrição</h1>
        <p className="text-center text-gray-500 text-sm mb-4">Concurso Culinário FAETEC 2026</p>
        <InscricaoWizard ingredientes={ingredientes} />
      </div>
    </div>
  );
}

// ── Admin Login Page ────────────────────────────────────────────
function AdminLoginPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.adminLogin({ email, senha });
      setAuth(res.data.token, res.data.nome, 'admin');
      navigate('/admin');
    } catch { setError('Credenciais inválidas.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛡️</div>
          <h2 className="text-xl font-bold">Acesso Administrativo</h2>
          <p className="text-gray-500 text-sm">MerendaChef — FAETEC</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">⚠️ {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none" required />
          <PasswordInput value={senha} onChange={e => setSenha(e.target.value)}
            placeholder="Senha"
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none pr-10" />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600">← Voltar ao portal</Link>
        </div>
      </div>
    </div>
  );
}

// ── App Router ─────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/trocar-senha" element={<PrivateRoute role="candidato"><TrocarSenhaPage /></PrivateRoute>} />
        <Route path="/inscricao" element={<PrivateRoute role="candidato"><InscricaoPage /></PrivateRoute>} />
        <Route path="/minha-inscricao" element={<PrivateRoute role="candidato"><MinhaInscricaoPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminPanel /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
