import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { repository } from '../../lib/repository';
import type { DocumentRecord, DocumentRevision, IssueSeverity } from '../../types/models';

export function CreateIssueForm({ documentRecord, revision, onDone }: { documentRecord: DocumentRecord; revision: DocumentRevision; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);

    await repository.createIssue({
      projectId: documentRecord.projectId,
      documentId: documentRecord.id,
      revisionId: revision.id,
      pageNumber: Number(form.get('pageNumber') ?? 1),
      x: Number(form.get('x') ?? 50),
      y: Number(form.get('y') ?? 50),
      category: String(form.get('category') ?? 'Incompatibilidade'),
      severity: String(form.get('severity') ?? 'media') as IssueSeverity,
      title: String(form.get('title') ?? '').trim(),
      description: String(form.get('description') ?? '').trim(),
      assignedTo: String(form.get('assignedTo') ?? '').trim(),
      dueDate: String(form.get('dueDate') ?? '').trim(),
      status: 'aberta',
      createdBy: 'Coordenador',
    });

    setBusy(false);
    onDone();
  }

  return (
    <Card>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Página">
              <Input name="pageNumber" type="number" min={1} defaultValue={1} required />
            </Field>
            <Field label="Posição X (%)">
              <Input name="x" type="number" min={0} max={100} defaultValue={50} required />
            </Field>
            <Field label="Posição Y (%)">
              <Input name="y" type="number" min={0} max={100} defaultValue={50} required />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Categoria">
              <Select name="category" defaultValue="Incompatibilidade">
                <option>Incompatibilidade</option>
                <option>Falta de informação</option>
                <option>Alteração de arquitetura</option>
                <option>Furo / shaft</option>
                <option>Divergência de medida</option>
                <option>Alteração de caminhamento</option>
                <option>Execução em campo</option>
              </Select>
            </Field>
            <Field label="Relevância">
              <Select name="severity" defaultValue="media">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </Select>
            </Field>
            <Field label="Título">
              <Input name="title" placeholder="Ex.: Conflito com shaft" required />
            </Field>
            <Field label="Responsável">
              <Input name="assignedTo" placeholder="Projetista / empresa" />
            </Field>
            <Field label="Prazo">
              <Input name="dueDate" type="date" />
            </Field>
          </div>
          <Field label="Descrição">
            <Textarea name="description" placeholder="Descreva o que precisa ser corrigido" required />
          </Field>
          <div className="flex justify-end">
            <Button disabled={busy}>{busy ? 'Salvando...' : 'Criar issue'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
