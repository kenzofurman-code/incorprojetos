import { useState, type FormEvent } from 'react';
import { Printer, Trash2 } from 'lucide-react';
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

  if (loading) return <p className="text-sm text-slate-500">Carregando controle de impressos...</p>;
  if (error) return <EmptyState title="Erro ao carregar" description={error} />;
  if (!state) return null;

  const appState = state;
  const released = appState.documents
    .map((documentRecord) => {
      const revision = appState.revisions.find((item) => item.id === documentRecord.latestApprovedRevisionId && item.status === 'liberado_obra');
      return revision ? { documentRecord, revision } : null;
    })
    .filter(Boolean) as { documentRecord: typeof appState.documents[number]; revision: typeof appState.revisions[number] }[];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pair = String(form.get('documentRevision') ?? '').split(':');
    if (pair.length !== 2) return;

    setBusy(true);
    await repository.createPrintRequest({
      projectId: appState.currentProjectId,
      documentId: pair[0],
      revisionId: pair[1],
      requestedBy: 'Coordenador',
      deliveredTo: String(form.get('deliveredTo') ?? '').trim(),
      location: String(form.get('location') ?? '').trim(),
    });
    setBusy(false);
    await reload();
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
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="pb-3">Documento</th>
                      <th className="pb-3">Revisão</th>
                      <th className="pb-3">Destino</th>
                      <th className="pb-3">Local</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Criado em</th>
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
                          <td className="py-3">{request.status}</td>
                          <td className="py-3">{formatDateTime(request.createdAt)}</td>
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

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <Trash2 size={18} className="mt-0.5" />
          <p>
            Próxima melhoria: ao liberar uma nova revisão, o sistema deve listar automaticamente quais impressos anteriores ficaram obsoletos e quem está com cada cópia.
          </p>
        </div>
      </div>
    </div>
  );
}
