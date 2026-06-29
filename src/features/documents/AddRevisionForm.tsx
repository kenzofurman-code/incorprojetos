import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Field, Input, Textarea } from '../../components/ui/Field';
import { repository } from '../../lib/repository';

export function AddRevisionForm({ documentId, onDone }: { documentId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!(file instanceof File) || !file.name) {
      setError('Selecione um PDF para upload.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await repository.addRevision(documentId, String(form.get('revisionCode') ?? '').trim(), file, 'Coordenador', String(form.get('notes') ?? '').trim());
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar revisão.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nova revisão">
              <Input name="revisionCode" placeholder="R01" required />
            </Field>
            <Field label="PDF">
              <Input name="file" type="file" accept="application/pdf,.pdf" required />
            </Field>
          </div>
          <Field label="Notas da revisão">
            <Textarea name="notes" placeholder="O que mudou nesta revisão?" />
          </Field>
          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <div className="flex justify-end">
            <Button disabled={busy}>{busy ? 'Enviando...' : 'Adicionar revisão'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
