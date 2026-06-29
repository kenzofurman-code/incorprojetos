import { CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../app/useAppData';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/dates';
import { repository } from '../../lib/repository';
import { revisionBadgeClass } from '../../lib/status';
import { revisionStatusLabel } from '../../types/models';

export function ApprovalPage() {
  const { state, loading, error, reload } = useAppData();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(revisionId: string, status: Parameters<typeof repository.updateRevisionStatus>[1]) {
    setBusy(`${revisionId}-${status}`);
    await repository.updateRevisionStatus(revisionId, status);
    setBusy(null);
    await reload();
  }

  if (loading) return <p className="text-sm text-slate-500">Carregando aprovações...</p>;
  if (error) return <EmptyState title="Erro ao carregar" description={error} />;
  if (!state) return null;

  const pending = state.revisions
    .filter((revision) => ['em_revisao', 'revisado', 'aprovado'].includes(revision.status))
    .map((revision) => ({ revision, documentRecord: state.documents.find((doc) => doc.id === revision.documentId) }))
    .filter((item) => item.documentRecord);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Controle de aprovação</h2>
        <p className="text-slate-500">Revise, aprove, rejeite e libere versões de projeto para obra.</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-bold">Fila de revisões</h3>
          <p className="text-sm text-slate-500">Itens que precisam de decisão do coordenador de projetos.</p>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState title="Nada pendente" description="Não existem revisões em análise no momento." />
          ) : (
            <div className="grid gap-3">
              {pending.map(({ revision, documentRecord }) => (
                <div key={revision.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black">{documentRecord?.code}</p>
                        <Badge className={revisionBadgeClass(revision.status)}>{revisionStatusLabel[revision.status]}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{documentRecord?.title}</p>
                      <p className="mt-2 text-xs text-slate-400">{revision.revisionCode} · enviado em {formatDateTime(revision.uploadedAt)} · {revision.fileName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/documentos/${documentRecord?.id}`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                        Abrir revisão
                      </Link>
                      <Button variant="secondary" disabled={Boolean(busy)} onClick={() => void setStatus(revision.id, 'aprovado')}>
                        <CheckCircle2 size={18} /> Aprovar
                      </Button>
                      <Button disabled={Boolean(busy)} onClick={() => void setStatus(revision.id, 'liberado_obra')}>
                        Liberar para obra
                      </Button>
                      <Button variant="danger" disabled={Boolean(busy)} onClick={() => void setStatus(revision.id, 'rejeitado')}>
                        <XCircle size={18} /> Rejeitar
                      </Button>
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
