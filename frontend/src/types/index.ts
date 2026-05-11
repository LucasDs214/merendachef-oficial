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
  unidadeEscolar: string;
  nomeDiretor: string;
  matricula: string;
  cargo: string;
  telefone: string;
  comprovanteVinculo: File | null;
  nomeReceita: string;
  descricao: string;
  modoPreparo: string;
  fotoReceita: File | null;
  ingredientes: { id: number; quantidade: string }[];
  aceitouLgpd: boolean;
  autorizouUsoImagem: boolean;
  aceitouTermosUso: boolean;
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
