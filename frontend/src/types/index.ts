// types/index.ts
export interface Candidato {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  primeiroAcesso: boolean;
}

export interface Ingrediente {
  id: number;
  nome: string;
  categoria: string;
  isInNatura: boolean;
  unidadeMedida: string;
}

export interface WizardData {
  // Passo 1
  unidadeEscolar: string;
  nomeDiretor: string;
  matricula: string;
  cargo: string;
  // Passo 2
  comprovanteVinculo: File | null;
  // Passo 3
  nomeReceita: string;
  descricao: string;
  fotoReceita: File | null;
  // Passo 4
  ingredienteIds: number[];
  // Passo 5
  aceitouLgpd: boolean;
  autorizouUsoImagem: boolean;
}

export interface InscricaoAdmin {
  id: string;
  candidato: {
    nome: string; cpf: string; email: string;
    unidade: string; diretor: string; matricula: string; cargo: string;
  };
  receita: { nome: string; descricao: string; foto?: string; comprovante: string };
  ingredientes: Array<{ id: number; nome: string; categoria: string; isInNatura: boolean }>;
  status: 'Pendente' | 'Habilitada' | 'Eliminada';
  motivoEliminacao?: string;
  notas: {
    viabilidade?: number; criatividade?: number;
    culturaRegional?: number; alimentosInNatura?: number; total?: number;
  };
  criadaEm: string;
}

export interface RankingItem {
  posicao: number;
  candidato: string;
  nomeReceita: string;
  notas: { viabilidade: number; criatividade: number; culturaRegional: number; alimentosInNatura: number; total: number };
}
