import type { DocumentRecord, DocumentRevision, ScheduleMilestone } from '../types/models';

const DAY_MS = 24 * 60 * 60 * 1000;

function dateOnly(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export interface MilestoneAssessment {
  status: ScheduleMilestone['status'];
  priority: 'critica' | 'alta' | 'media' | 'normal';
  score: number;
  daysToConstruction: number;
  linkedDocuments: number;
  pendingDocuments: number;
}

export function assessMilestone(
  milestone: ScheduleMilestone,
  documents: DocumentRecord[],
  revisions: DocumentRevision[],
  now = new Date(),
): MilestoneAssessment {
  const linkedIds = milestone.documentIds ?? [];
  const linkedDocuments = documents.filter((documentRecord) => linkedIds.includes(documentRecord.id));
  const pendingDocuments = linkedDocuments.filter((documentRecord) => {
    const revision = revisions.find((item) => item.id === documentRecord.latestApprovedRevisionId);
    return !revision || revision.status !== 'liberado_obra';
  }).length;
  const delivered = linkedDocuments.length > 0 && pendingDocuments === 0;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const constructionDate = dateOnly(milestone.requiredForConstructionDate);
  const promisedDate = dateOnly(milestone.promisedByDesignerDate);
  const daysToConstruction = Math.ceil((constructionDate.getTime() - today.getTime()) / DAY_MS);
  const promiseIsLate = promisedDate.getTime() > constructionDate.getTime();
  const promiseExpired = promisedDate.getTime() < today.getTime();

  let status: ScheduleMilestone['status'] = 'no_prazo';
  if (delivered) status = 'entregue';
  else if (daysToConstruction < 0 || promiseExpired) status = 'atrasado';
  else if (daysToConstruction <= 14 || promiseIsLate) status = 'risco';

  let score = status === 'atrasado' ? 100 : status === 'risco' ? 65 : status === 'entregue' ? 0 : 20;
  if (!delivered) {
    score += Math.max(0, 30 - Math.max(daysToConstruction, 0));
    score += pendingDocuments * 8;
    if (linkedDocuments.length === 0) score += 15;
    if (promiseIsLate) score += 20;
  }

  const priority = score >= 100 ? 'critica' : score >= 70 ? 'alta' : score >= 35 ? 'media' : 'normal';
  return {
    status,
    priority,
    score,
    daysToConstruction,
    linkedDocuments: linkedDocuments.length,
    pendingDocuments,
  };
}

export const milestoneStatusLabel: Record<ScheduleMilestone['status'], string> = {
  no_prazo: 'No prazo',
  risco: 'Em risco',
  atrasado: 'Atrasado',
  entregue: 'Entregue',
};

export const milestonePriorityLabel: Record<MilestoneAssessment['priority'], string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  normal: 'Normal',
};
