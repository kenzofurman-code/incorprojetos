import { useState, type FormEvent } from 'react';
import { Ban, Check, PackageCheck, Printer } from 'lucide-react';
import { useAppData } from '../../app/useAppData';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input, Select } from '../../components/ui/Field';
import { formatDateTime } from '../../lib/dates';
import { repository } from '../../lib/repository';

export function PrintControlPage() {
  const { state, loading, error, reload } = useAppData();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-slate-500">Carregando controle de impressos...</p>;
  if (error) return <EmptyState title="Erro ao carregar" description={error} />;
  if (!state) return null;

  const appState = state;
  const released = appState.documents
    .map((documentRecord) => {
      const releasedRevisions = appState.revisions
        .filter((item) => item.documentId === documentRecord.id && item.status === 'liberado_obra')
        .sort((first, second) => (second.releasedForSiteAt ?? second.uploadedAt).localeCompare(first.releasedForSiteAt ?? first.uploadedAt));
      const revision =
        releasedRevisions.find((item) => item.id === documentRecord.latestReleasedRevisionId) ??
        releasedRevisions.find((item) => item.id === documentRecord.latestApprovedRevisionId) ??
        releasedRevisions[0];
      return revision ? { documentRecord, revision } : null;
    })
    .filter(Boolean) as { documentRecord: typeof appState.documents[number]; revision: typeof appState.revisions[number] }[];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pair = String(form.get('documentRevision') ?? '').split(':');
    if (pair.length !== 2) return;

    setBusy(true);
    setActionError(null);
    try {
      await repository.createPrintRequest({
        projectId: appState.currentProjectId,
        documentId: pair[0],
        revisionId: pair[1],
        requestedBy: 'Coordenador',
        deliveredTo: String(form.get('deliveredTo') ?? '').trim(),
        location: String(form.get('location') ?? '').trim(),
        copies: Math.max(1, Number(form.get('copies') ?? 1)),
      });
      await reload();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Não foi possível solicitar a plotagem.');
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id: string, status: 'impresso' | 'entregue' | 'obsoleto') {
    setBusy(true);
    setActionError(null);
    try {
      await repository.updatePrintRequest(id, status === 'impresso' ? { status, printedBy: 'Coordenador' } : { status });
      await reload();
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Não foi possível atualizar o impresso.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Controle de impressos</h2>
        <p className="text-slate-500">Solicite plotagens e registre a circulação de pranchas físicas em campo.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <h3 className="font-bold">Nova solicitação</h3>
            <p className="text-sm text-slate-500">Apenas versões liberadas para obra aparecem aqui.</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Field label="Documento">
                <Select name="documentRevision" required>
                  <option value="">Selecione</option>
                  {released.map(({ documentRecord, revision }) => (
                    <option key={revision.id} value={`${documentRecord.id}:${revision.id}`}>{`${documentRecord.code} · ${revision.revisionCode}`}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Entregar para">
                <Input name="deliveredTo" placeholder="Mestre, empreiteiro, equipe" />
              </Field>
              <Field label="Local de entrega">
                <Input name="location" placeholder="Obra / pavimento / sala" />
              </Field>
              <Field label="Quantidade de cópias">
                <Input defaultValue={1} min={1} name="copies" type="number" />
              </Field>
              {actionError && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
              <Button disabled={busy || released.length === 0}>
                <Printer size={18} /> {busy ? 'Salvando...' : 'Solicitar plotagem'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <h3 className="font-bold">Solicitações</h3>
            <p className="text-sm text-slate-500">Histórico inicial de plotagens e controle de obsolescência.</p>
          </CardHeader>
          <CardContent>
            {state.printRequests.length === 0 ? (
              <EmptyState title="Nenhuma solicitação" description="Crie uma solicitação de plotagem para começar o controle de impressos." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="pb-3">Documento</th>
                      <th className="pb-3">Revisão</th>
                      <th className="pb-3">Destino</th>
                      <th className="pb-3">Local</th>
                      <th className="pb-3">Cópias</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Rastreio</th>
                      <th className="pb-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.printRequests.map((request) => {
                      const documentRecord = state.documents.find((item) => item.id === request.documentId);
                      const revision = state.revisions.find((item) => item.id === request.revisionId);
                      return (
                        <tr key={request.id}>
                          <td className="py-3 font-semibold">{documentRecord?.code ?? '-'}</td>
                          <td className="py-3">{revision?.revisionCode ?? '-'}</td>
                          <td className="py-3">{request.deliveredTo || '-'}</td>
                          <td className="py-3">{request.location || '-'}</td>
                          <td className="py-3">{request.copies ?? 1}</td>
                          <td className="py-3 font-semibold">{request.status}</td>
                          <td className="py-3 text-xs text-slate-500">
                            <p>Solicitado: {formatDateTime(request.createdAt)}</p>
                            {request.printedAt && <p>Impresso: {formatDateTime(request.printedAt)} {request.printedBy ? `por ${request.printedBy}` : ''}</p>}
                            {request.deliveredAt && <p>Entregue: {formatDateTime(request.deliveredAt)}</p>}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              {request.status === 'solicitado' && (
                                <Button className="px-2 py-1 text-xs" disabled={busy} onClick={() => void updateStatus(request.id, 'impresso')} variant="secondary">
                                  <Check size={14} /> Impresso
                                </Button>
                              )}
                              {request.status === 'impresso' && (
                                <Button className="px-2 py-1 text-xs" disabled={busy} onClick={() => void updateStatus(request.id, 'entregue')} variant="secondary">
                                  <PackageCheck size={14} /> Entregue
                                </Button>
                              )}
                              {request.status !== 'obsoleto' && (
                                <Button aria-label="Marcar como obsoleto" className="px-2 py-1" disabled={busy} onClick={() => void updateStatus(request.id, 'obsoleto')} variant="ghost">
                                  <Ban size={14} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Ao liberar uma nova revisão para obra, solicitações e cópias vinculadas às revisões anteriores são marcadas automaticamente como obsoletas.
      </div>
    </div>
  );
}
