import { ArrowLeft, Check, ExternalLink, Flag, Layers3, Plus, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAppData } from '../../app/useAppData';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/dates';
import { repository } from '../../lib/repository';
import { issueBadgeClass, revisionBadgeClass, severityBadgeClass } from '../../lib/status';
import { issueStatusLabel, phaseLabel, revisionStatusLabel } from '../../types/models';
import { AddRevisionForm } from './AddRevisionForm';
import { CreateIssueForm } from './CreateIssueForm';

export function DocumentDetailPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { state, loading, error, reload } = useAppData();
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const documentRecord = state?.documents.find((item) => item.id === documentId);
  const revisions = useMemo(() => state?.revisions.filter((revision) => revision.documentId === documentId) ?? [], [state, documentId]);
  const currentRevision = revisions.find((revision) => revision.id === documentRecord?.currentRevisionId) ?? revisions.at(-1);
  const issues = state?.issues.filter((issue) => issue.documentId === documentId) ?? [];

  async function setStatus(revisionId: string, status: Parameters<typeof repository.updateRevisionStatus>[1]) {
    setBusy(`${revisionId}-${status}`);
    await repository.updateRevisionStatus(revisionId, status);
    setBusy(null);
    await reload();
  }

  if (loading) return <p className="text-sm text-slate-500">Carregando documento...</p>;
  if (error) return <EmptyState title="Erro ao carregar" description={error} />;
  if (!state || !documentRecord) return <EmptyState title="Documento não encontrado" description="Volte para a lista e selecione outro documento." />;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" to="/documentos">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h2 className="text-3xl font-black tracking-tight">{documentRecord.code}</h2>
          <p className="text-slate-500">{documentRecord.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {revisions.filter((revision) => revision.fileUrl).length >= 2 && (
            <Button variant="secondary" onClick={() => navigate(`/documentos/${documentRecord?.id}/comparar`)}>
              <Layers3 size={18} /> Comparar revisões
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowAddRevision((value) => !value)}>
            <Plus size={18} /> Nova revisão
          </Button>
          {currentRevision ? (
            <Button onClick={() => setShowIssueForm((value) => !value)}>
              <Flag size={18} /> Nova issue
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent><p className="text-sm text-slate-500">Disciplina</p><p className="mt-1 text-2xl font-black">{documentRecord.disciplineCode}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Fase</p><p className="mt-1 text-2xl font-black">{phaseLabel[documentRecord.phase]}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Pavimento</p><p className="mt-1 text-2xl font-black">{documentRecord.floor || '-'}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Issues</p><p className="mt-1 text-2xl font-black">{issues.length}</p></CardContent></Card>
      </div>

      {showAddRevision ? <AddRevisionForm documentId={documentRecord.id} onDone={() => { setShowAddRevision(false); void reload(); }} /> : null}
      {showIssueForm && currentRevision ? <CreateIssueForm documentRecord={documentRecord} revision={currentRevision} onDone={() => { setShowIssueForm(false); void reload(); }} /> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <h3 className="font-bold">Visualizador PDF</h3>
            <p className="text-sm text-slate-500">Nesta primeira versão o PDF é exibido; marcações gráficas avançadas entram na próxima etapa.</p>
          </CardHeader>
          <CardContent>
            {currentRevision?.fileUrl ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <iframe src={currentRevision.fileUrl} title="PDF do projeto" className="h-[680px] w-full bg-white" />
              </div>
            ) : (
              <div className="pdf-grid-bg grid h-[520px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <Layers3 className="mx-auto text-slate-400" size={44} />
                  <h3 className="mt-4 text-lg font-bold">PDF de demonstração</h3>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    O registro demo não possui arquivo real. Faça upload de um PDF para testar o visualizador.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Revisões</h3>
            <p className="text-sm text-slate-500">Aprovação e liberação para obra.</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {revisions.map((revision) => (
              <div key={revision.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black">{revision.revisionCode}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(revision.uploadedAt)}</p>
                  </div>
                  <Badge className={revisionBadgeClass(revision.status)}>{revisionStatusLabel[revision.status]}</Badge>
                </div>
                <p className="mt-3 truncate text-sm text-slate-500">{revision.fileName}</p>
                <div className="mt-4 grid gap-2">
                  {revision.fileUrl ? (
                    <a className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950" href={revision.fileUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={15} /> Abrir arquivo
                    </a>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled={Boolean(busy)} onClick={() => void setStatus(revision.id, 'aprovado')}>
                      <Check size={14} /> Aprovar
                    </Button>
                    <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled={Boolean(busy)} onClick={() => void setStatus(revision.id, 'liberado_obra')}>
                      Liberar
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5 text-xs" disabled={Boolean(busy)} onClick={() => void setStatus(revision.id, 'rejeitado')}>
                      <X size={14} /> Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-bold">Issues da revisão</h3>
          <p className="text-sm text-slate-500">Pendências categorizadas para análise e lições aprendidas.</p>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <EmptyState title="Nenhuma issue cadastrada" description="Use o botão Nova issue para registrar uma pendência técnica." />
          ) : (
            <div className="grid gap-3">
              {issues.map((issue) => (
                <div key={issue.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-bold">#{issue.id.slice(-5).toUpperCase()} · {issue.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{issue.description}</p>
                      <p className="mt-2 text-xs text-slate-400">Página {issue.pageNumber} · x {issue.x}% · y {issue.y}% · Responsável: {issue.assignedTo || '-'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={severityBadgeClass(issue.severity)}>{issue.severity}</Badge>
                      <Badge className={issueBadgeClass(issue.status)}>{issueStatusLabel[issue.status]}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
