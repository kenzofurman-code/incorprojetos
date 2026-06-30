export type RevisionStatus =
  | 'rascunho'
  | 'em_revisao'
  | 'revisado'
  | 'aprovado'
  | 'liberado_obra'
  | 'rejeitado'
  | 'obsoleto';

export type IssueStatus = 'aberta' | 'em_correcao' | 'corrigida' | 'validada' | 'cancelada';
export type IssueSeverity = 'baixa' | 'media' | 'alta' | 'critica';
export type ProjectPhase = 'estudo_preliminar' | 'anteprojeto' | 'projeto_legal' | 'executivo' | 'as_built';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'coordenador' | 'projetista' | 'obra' | 'admin';
}

export interface Project {
  id: string;
  name: string;
  code: string;
  address?: string;
  status: 'ativo' | 'arquivado';
  createdAt: string;
}

export interface Discipline {
  id: string;
  code: string;
  name: string;
  color: string;
}

export interface ScheduleMilestone {
  id: string;
  projectId: string;
  title: string;
  disciplineCode: string;
  requiredForConstructionDate: string;
  promisedByDesignerDate: string;
  responsibleCompany: string;
  status: 'no_prazo' | 'risco' | 'atrasado' | 'entregue';
  documentIds?: string[];
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  code: string;
  title: string;
  disciplineCode: string;
  phase: ProjectPhase;
  block?: string;
  floor?: string;
  area?: string;
  currentRevisionId?: string;
  latestApprovedRevisionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRevision {
  id: string;
  documentId: string;
  revisionCode: string;
  fileName: string;
  fileUrl: string;
  storagePath?: string;
  uploadedBy: string;
  uploadedAt: string;
  status: RevisionStatus;
  approvedAt?: string;
  approvedBy?: string;
  releasedForSiteAt?: string;
  obsoleteAt?: string;
  notes?: string;
}

export interface Issue {
  id: string;
  projectId: string;
  documentId: string;
  revisionId: string;
  pageNumber: number;
  x: number;
  y: number;
  category: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  assignedTo?: string;
  dueDate?: string;
  status: IssueStatus;
  createdBy: string;
  createdAt: string;
}

export interface PrintRequest {
  id: string;
  projectId: string;
  documentId: string;
  revisionId: string;
  requestedBy: string;
  printedBy?: string;
  deliveredTo?: string;
  location?: string;
  status: 'solicitado' | 'impresso' | 'entregue' | 'obsoleto';
  createdAt: string;
  printedAt?: string;
  deliveredAt?: string;
}

export interface AppState {
  currentProjectId: string;
  projects: Project[];
  disciplines: Discipline[];
  milestones: ScheduleMilestone[];
  documents: DocumentRecord[];
  revisions: DocumentRevision[];
  issues: Issue[];
  printRequests: PrintRequest[];
}

export const revisionStatusLabel: Record<RevisionStatus, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  revisado: 'Revisado',
  aprovado: 'Aprovado',
  liberado_obra: 'Liberado para obra',
  rejeitado: 'Rejeitado',
  obsoleto: 'Obsoleto',
};

export const issueStatusLabel: Record<IssueStatus, string> = {
  aberta: 'Aberta',
  em_correcao: 'Em correção',
  corrigida: 'Corrigida',
  validada: 'Validada',
  cancelada: 'Cancelada',
};

export const phaseLabel: Record<ProjectPhase, string> = {
  estudo_preliminar: 'Estudo preliminar',
  anteprojeto: 'Anteprojeto',
  projeto_legal: 'Projeto legal',
  executivo: 'Executivo',
  as_built: 'As built',
};
