import { AlertTriangle, CalendarDays, FileSpreadsheet, Pencil, Trash2, Upload } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useAppData } from '../../app/useAppData';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input, Select } from '../../components/ui/Field';
import { formatDate } from '../../lib/dates';
import { repository } from '../../lib/repository';
import { assessMilestone, milestonePriorityLabel, milestoneStatusLabel } from '../../lib/schedule';
import { parseMilestoneFile } from '../../lib/schedule-import';
import type { ScheduleMilestone } from '../../types/models';

const priorityClass = {
  critica: 'bg-rose-100 text-rose-800',
  alta: 'bg-orange-100 text-orange-800',
  media: 'bg-amber-100 text-amber-800',
  normal: 'bg-slate-100 text-slate-700',
};

export function SchedulePage() {
  const { state, loading, error, reload } = useAppData();
  const [editing, setEditing] = useState<ScheduleMilestone | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const rankedMilestones = useMemo(() => {
    if (!state) return [];
    return state.milestones
      .map((milestone) => ({ milestone, assessment: assessMilestone(milestone, state.documents, state.revisions) }))
      .sort((first, second) => second.assessment.score - first.assessment.score);
  }, [state]);

  if (loading) return <p className="text-sm text-slate-500">Carregando cronograma...</p>;
  if (error) return <EmptyState title="Erro ao carregar" description={error} />;
  if (!state) return null;
  const appState = state;

  function beginEdit(milestone: ScheduleMilestone) {
    setEditing(milestone);
    setSelectedDocumentIds(milestone.documentIds ?? []);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearForm() {
    setEditing(null);
    setSelectedDocumentIds([]);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setFormError(null);
    try {
      await repository.upsertMilestone({
        id: editing?.id,
        projectId: appState.currentProjectId,
        title: String(form.get('title') ?? '').trim(),
        disciplineCode: String(form.get('disciplineCode') ?? ''),
        requiredForConstructionDate: String(form.get('requiredForConstructionDate') ?? ''),
        promisedByDesignerDate: String(form.get('promisedByDesignerDate') ?? ''),
        responsibleCompany: String(form.get('responsibleCompany') ?? '').trim(),
        documentIds: selectedDocumentIds,
      });
      clearForm();
      setMessage(editing ? 'Marco atualizado.' : 'Marco cadastrado.');
      await reload();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o marco.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir este marco do cronograma?')) return;
    setBusy(true);
    try {
      await repository.deleteMilestone(id);
      if (editing?.id === id) clearForm();
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(file: File) {
    setBusy(true);
    setFormError(null);
    setMessage(null);
    try {
      const result = await parseMilestoneFile(file, appState.documents);
      await Promise.all(
        result.milestones.map((milestone) =>
          repository.upsertMilestone({ ...milestone, projectId: appState.currentProjectId }),
        ),
      );
      setMessage(
        `${result.milestones.length} marco(s) importado(s).${
          result.warnings.length ? ` Avisos: ${result.warnings.join(' ')}` : ''
        }`,
      );
      await reload();
    } catch (importError) {
      setFormError(importError instanceof Error ? importError.message : 'Falha ao importar o arquivo.');
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const content = [
      'marco;disciplina;necessario_obra;prometido_projetista;responsavel;documentos',
      'Plantas de alvenaria;ARQ;30/09/2026;15/09/2026;Escritório Alfa;ARQ-001|ARQ-002',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'modelo-cronograma.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Cronograma projeto × obra</h2>
        <p className="text-slate-500">Marcos, datas necessárias, documentos vinculados e prioridade automática para a obra.</p>
      </div>

      {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</div>}
      {formError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{formError}</div>}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <h3 className="font-bold">{editing ? 'Editar marco' : 'Novo marco'}</h3>
            <p className="text-sm text-slate-500">O status é recalculado automaticamente pelas datas e documentos liberados.</p>
          </CardHeader>
          <CardContent>
            <form key={editing?.id ?? 'new'} className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Marco">
                  <Input defaultValue={editing?.title} name="title" required />
                </Field>
                <Field label="Disciplina">
                  <Select defaultValue={editing?.disciplineCode} name="disciplineCode" required>
                    <option value="">Selecione</option>
                    {state.disciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.code}>{`${discipline.code} · ${discipline.name}`}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Necessário para obra">
                  <Input defaultValue={editing?.requiredForConstructionDate} name="requiredForConstructionDate" required type="date" />
                </Field>
                <Field label="Prometido pelo projetista">
                  <Input defaultValue={editing?.promisedByDesignerDate} name="promisedByDesignerDate" required type="date" />
                </Field>
                <Field label="Responsável">
                  <Input defaultValue={editing?.responsibleCompany} name="responsibleCompany" placeholder="Empresa ou projetista" />
                </Field>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Documentos vinculados</p>
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-2xl border border-slate-200 p-3 md:grid-cols-2">
                  {state.documents.length ? state.documents.map((documentRecord) => (
                    <label key={documentRecord.id} className="flex cursor-pointer items-start gap-2 rounded-xl p-2 text-sm hover:bg-slate-50">
                      <input
                        checked={selectedDocumentIds.includes(documentRecord.id)}
                        className="mt-1"
                        onChange={(event) =>
                          setSelectedDocumentIds((current) =>
                            event.target.checked
                              ? [...current, documentRecord.id]
                              : current.filter((id) => id !== documentRecord.id),
                          )
                        }
                        type="checkbox"
                      />
                      <span><strong>{documentRecord.code}</strong><br /><span className="text-xs text-slate-500">{documentRecord.title}</span></span>
                    </label>
                  )) : <p className="text-sm text-slate-500">Cadastre documentos antes de criar vínculos.</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {editing && <Button onClick={clearForm} type="button" variant="secondary">Cancelar</Button>}
                <Button disabled={busy}>{busy ? 'Salvando...' : editing ? 'Atualizar marco' : 'Cadastrar marco'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Importar cronograma</h3>
            <p className="text-sm text-slate-500">Arquivos CSV ou XLSX. Datas em DD/MM/AAAA ou AAAA-MM-DD.</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button onClick={downloadTemplate} type="button" variant="secondary">
              <FileSpreadsheet size={18} /> Baixar modelo CSV
            </Button>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center hover:bg-slate-50">
              <Upload size={24} className="text-slate-400" />
              <span className="text-sm font-semibold">Selecionar CSV ou XLSX</span>
              <input
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleImport(file);
                  event.target.value = '';
                }}
                type="file"
              />
            </label>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-bold">Prioridade para obra</h3>
          <p className="text-sm text-slate-500">Ordenação automática por atraso, proximidade da necessidade e documentos pendentes.</p>
        </CardHeader>
        <CardContent>
          {rankedMilestones.length === 0 ? (
            <EmptyState title="Nenhum marco cadastrado" description="Cadastre ou importe o cronograma para iniciar o acompanhamento." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3">Prioridade</th>
                    <th className="pb-3">Marco</th>
                    <th className="pb-3">Disciplina</th>
                    <th className="pb-3">Necessário</th>
                    <th className="pb-3">Prometido</th>
                    <th className="pb-3">Documentos</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedMilestones.map(({ milestone, assessment }) => (
                    <tr key={milestone.id}>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${priorityClass[assessment.priority]}`}>
                          {milestonePriorityLabel[assessment.priority]}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">{milestone.title}</td>
                      <td className="py-3">{milestone.disciplineCode}</td>
                      <td className="py-3">{formatDate(milestone.requiredForConstructionDate)}</td>
                      <td className="py-3">{formatDate(milestone.promisedByDesignerDate)}</td>
                      <td className="py-3">{assessment.pendingDocuments}/{assessment.linkedDocuments} pendentes</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1">
                          {assessment.status === 'atrasado' && <AlertTriangle size={14} className="text-rose-600" />}
                          {milestoneStatusLabel[assessment.status]}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button aria-label="Editar marco" className="px-2 py-1" onClick={() => beginEdit(milestone)} variant="ghost"><Pencil size={15} /></Button>
                          <Button aria-label="Excluir marco" className="px-2 py-1" disabled={busy} onClick={() => void handleDelete(milestone.id)} variant="ghost"><Trash2 size={15} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <CalendarDays className="text-slate-400" />
        Marcos entregues exigem que todos os documentos vinculados estejam liberados para obra.
      </div>
    </div>
  );
}
