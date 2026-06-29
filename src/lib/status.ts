import type { IssueSeverity, IssueStatus, RevisionStatus } from '../types/models';

export function revisionBadgeClass(status: RevisionStatus): string {
  const map: Record<RevisionStatus, string> = {
    rascunho: 'bg-slate-100 text-slate-700 border-slate-200',
    em_revisao: 'bg-amber-100 text-amber-800 border-amber-200',
    revisado: 'bg-sky-100 text-sky-800 border-sky-200',
    aprovado: 'bg-blue-100 text-blue-800 border-blue-200',
    liberado_obra: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejeitado: 'bg-rose-100 text-rose-800 border-rose-200',
    obsoleto: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  };
  return map[status];
}

export function issueBadgeClass(status: IssueStatus): string {
  const map: Record<IssueStatus, string> = {
    aberta: 'bg-rose-100 text-rose-800 border-rose-200',
    em_correcao: 'bg-amber-100 text-amber-800 border-amber-200',
    corrigida: 'bg-sky-100 text-sky-800 border-sky-200',
    validada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelada: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  };
  return map[status];
}

export function severityBadgeClass(severity: IssueSeverity): string {
  const map: Record<IssueSeverity, string> = {
    baixa: 'bg-slate-100 text-slate-700 border-slate-200',
    media: 'bg-amber-100 text-amber-800 border-amber-200',
    alta: 'bg-orange-100 text-orange-800 border-orange-200',
    critica: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return map[severity];
}
