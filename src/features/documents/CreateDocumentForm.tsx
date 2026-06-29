import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { repository } from '../../lib/repository';
import type { Discipline, DocumentRecord, ProjectPhase } from '../../types/models';
import { phaseLabel } from '../../types/models';

interface Props {
  disciplines: Discipline[];
  projectId: string;
  onDone: () => void;
}

export function CreateDocumentForm({ disciplines, projectId, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const file = form.get('file');

    if (!(file instanceof File) || !file.name) {
      setError('Selecione um PDF para upload.');
      setBusy(false);
      return;
    }

    try {
      await repository.createDocumentWithRevision({
        projectId,
        code: String(form.get('code') ?? '').trim(),
        title: String(form.get('title') ?? '').trim(),
        disciplineCode: String(form.get('disciplineCode') ?? ''),
        phase: String(form.get('phase') ?? 'executivo') as DocumentRecord['phase'],
        block: String(form.get('block') ?? '').trim(),
        floor: String(form.get('floor') ?? '').trim(),
        area: String(form.get('area') ?? '').trim(),
        revisionCode: String(form.get('revisionCode') ?? 'R00').trim(),
        notes: String(form.get('notes') ?? '').trim(),
        file,
        uploadedBy: 'Coordenador',
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Código do documento">
              <Input name="code" placeholder="DMX-GMB-EX-ARQ-P03-PLA-002" required />
            </Field>
            <Field label="Título">
              <Input name="title" placeholder="Planta de acabamentos" required />
            </Field>
            <Field label="Disciplina">
              <Select name="disciplineCode" required>
                {disciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.code}>{`[${discipline.code}] ${discipline.name}`}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fase">
              <Select name="phase" defaultValue="executivo">
                {Object.entries(phaseLabel).map(([value, label]) => (
                  <option key={value} value={value as ProjectPhase}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Bloco / Torre">
              <Input name="block" placeholder="Torre A" />
            </Field>
            <Field label="Pavimento">
              <Input name="floor" placeholder="03" />
            </Field>
            <Field label="Ambiente / Lista">
              <Input name="area" placeholder="Apto 31" />
            </Field>
            <Field label="Revisão inicial">
              <Input name="revisionCode" defaultValue="R00" required />
            </Field>
          </div>
          <Field label="PDF do projeto">
            <Input name="file" type="file" accept="application/pdf,.pdf" required />
          </Field>
          <Field label="Observações">
            <Textarea name="notes" placeholder="Resumo do envio, pendências ou contexto da revisão" />
          </Field>
          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <div className="flex justify-end">
            <Button disabled={busy}>{busy ? 'Enviando...' : 'Cadastrar documento'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
