import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('mc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mc_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  registrar: (data: { nome: string; cpf: string; email: string }) =>
    api.post('/api/auth/registro', data),
  login: (data: { cpf: string; senha: string }) =>
    api.post('/api/auth/login', data),
  trocarSenha: (data: { senhaAtual: string; novaSenha: string }) =>
    api.post('/api/auth/trocar-senha', data),
  adminLogin: (data: { email: string; senha: string }) =>
    api.post('/api/auth/admin/login', data),
  resetSenha: (cpf: string) =>        // ← adicione esta linha
    api.post('/api/auth/reset-senha', { cpf }),
};

// Inscrições
export const inscricaoApi = {
  enviar: (formData: FormData) =>
    api.post('/api/inscricoes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  minha: () => api.get('/api/inscricoes/minha'),
  ingredientes: () => api.get('/api/inscricoes/ingredientes'),
};

// Admin
export const adminApi = {
  listar: (status?: string) =>
    api.get('/api/admin/inscricoes', { params: status ? { status } : {} }),
  habilitar: (id: string) =>
    api.patch(`/api/admin/inscricoes/${id}/habilitar`),
  eliminar: (id: string, motivo: string) =>
    api.patch(`/api/admin/inscricoes/${id}/eliminar`, { motivo }),
  lancarNotas: (id: string, notas: object) =>
    api.patch(`/api/admin/inscricoes/${id}/notas`, notas),
  ranking: () =>
    api.get('/api/admin/ranking'),
  convocar: (id: string, dados: object) =>
    api.patch(`/api/admin/inscricoes/${id}/convocar`, dados),
};
