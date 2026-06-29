import { AlertTriangle, CheckCircle2, Clock3, FileStack, Printer, SearchCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../app/useAppData';
import { formatDate } from '../../lib/dates';
import { revisionStatusLabel } from '../../types/models';

function MetricCard({ label, value, icon: Icon, helper }: { label: string; value: number | string; helper: string; icon: typeof FileStack }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon size={22} />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { state, loading, error } = useAppData();

  if (loading) return <p className="text-sm text-slate-500">Carregando dashboard...</p>;
  if (error) return <EmptyState title="Erro ao carregar" description={error} />;
  if (!state) return null;

  const docs = state.documents;
  const revisions = state.revisions;
  const released = revisions.filter((revision) => revision.status === 'liberado_obra').length;
  const inReview = revisions.filter((revision) => revision.status === 'em_revisao').length;
  const openIssues = state.issues.filter((issue) => ['aberta', 'em_correcao'].includes(issue.status)).length;
  const printPending = state.printRequests.filter((request) => request.status === 'solicitado').length;
  const riskyMilestones = state.milestones.filter((milestone) => ['risco', 'atrasado'].includes(milestone.status));

  const issuesByCategory = state.issues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue.category] = (acc[issue.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Dashboard do empreendimento</h2>
          <p className="text-slate-500">Resumo de documentos, revisões, issues, aprovações e uso em obra.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Documentos" value={docs.length} helper="cadastrados no CDE" icon={FileStack} />
        <MetricCard label="Liberados" value={released} helper="versões para obra" icon={CheckCircle2} />
        <MetricCard label="Em revisão" value={inReview} helper="aguardando análise" icon={Clock3} />
        <MetricCard label="Issues abertas" value={openIssues} helper="pendências técnicas" icon={AlertTriangle} />
        <MetricCard label="Plotagem" value={printPending} helper="solicitações pendentes" icon={Printer} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <h3 className="font-bold">Cronograma de projetos × obra</h3>
            <p className="text-sm text-slate-500">Marcos que precisam ser acompanhados pelo coordenador.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3">Marco</th>
                    <th className="pb-3">Disciplina</th>
                    <th className="pb-3">Necessário para obra</th>
                    <th className="pb-3">Prometido projetista</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.milestones.map((milestone) => (
                    <tr key={milestone.id}>
                      <td className="py-3 font-medium">{milestone.title}</td>
                      <td className="py-3">{milestone.disciplineCode}</td>
                      <td className="py-3">{formatDate(milestone.requiredForConstructionDate)}</td>
                      <td className="py-3">{formatDate(milestone.promisedByDesignerDate)}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{milestone.status.replace('_', ' ')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Principais issues</h3>
            <p className="text-sm text-slate-500">Base para lições aprendidas.</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {Object.entries(issuesByCategory).length ? (
              Object.entries(issuesByCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-lg font-black">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Nenhuma issue cadastrada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="font-bold">Últimas revisões</h3>
            <p className="text-sm text-slate-500">Histórico recente de uploads e liberações.</p>
          </div>
          <SearchCheck className="text-slate-400" size={20} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-3">Arquivo</th>
                  <th className="pb-3">Revisão</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Enviado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revisions.slice(0, 6).map((revision) => (
                  <tr key={revision.id}>
                    <td className="py-3 font-medium">{revision.fileName}</td>
                    <td className="py-3">{revision.revisionCode}</td>
                    <td className="py-3">{revisionStatusLabel[revision.status]}</td>
                    <td className="py-3">{revision.uploadedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {riskyMilestones.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Atenção: existem {riskyMilestones.length} marco(s) em risco ou atraso que podem impactar a obra.
        </div>
      ) : null}
    </div>
  );
}
