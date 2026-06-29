import { useState, type FormEvent } from 'react';
import { RefreshCw, Save, Trash2 } from 'lucide-react';
import { useAppData } from '../../app/useAppData';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input } from '../../components/ui/Field';
import { repository } from '../../lib/repository';

export function SettingsPage() {
  const { state, loading, error, reload, mode } = useAppData();
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="text-sm text-slate-500">Carregando configurações...</p>;
  if (error) return <EmptyState title="Erro ao carregar" description={error} />;
  if (!state) return null;

  async function saveDiscipline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    await repository.upsertDiscipline({
      code: String(form.get('code') ?? '').trim(),
      name: String(form.get('name') ?? '').trim(),
      color: String(form.get('color') ?? '#64748b'),
    });
    setBusy(false);
    event.currentTarget.reset();
    await reload();
  }

  async function removeDiscipline(id: string) {
    setBusy(true);
    await repository.deleteDiscipline(id);
    setBusy(false);
    await reload();
  }

  async function resetDemo() {
    setBusy(true);
    await repository.resetDemo();
    setBusy(false);
    await reload();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Configurações</h2>
        <p className="text-slate-500">Disciplinas, siglas, cores e dados base do protótipo.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <h3 className="font-bold">Nova disciplina</h3>
            <p className="text-sm text-slate-500">Use as siglas para classificar os documentos.</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={saveDiscipline}>
              <Field label="Sigla">
                <Input name="code" placeholder="ARQ" maxLength={8} required />
              </Field>
              <Field label="Nome">
                <Input name="name" placeholder="Arquitetura" required />
              </Field>
              <Field label="Cor">
                <Input name="color" type="color" defaultValue="#64748b" />
              </Field>
              <Button disabled={busy}>
                <Save size={18} /> Salvar disciplina
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold">Disciplinas cadastradas</h3>
              <p className="text-sm text-slate-500">Base para documentos, armário digital e dashboard.</p>
            </div>
            <Button variant="secondary" disabled={busy || mode === 'firebase'} onClick={() => void resetDemo()}>
              <RefreshCw size={18} /> Restaurar demo
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {state.disciplines.map((discipline) => (
                <div key={discipline.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-2 rounded-full" style={{ backgroundColor: discipline.color }} />
                    <div>
                      <p className="font-black">{discipline.code}</p>
                      <p className="text-sm text-slate-500">{discipline.name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="px-3" disabled={busy} onClick={() => void removeDiscipline(discipline.id)} aria-label="Excluir disciplina">
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-bold">Firebase</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Modo atual: <strong>{mode}</strong>. Para conectar com Firebase, copie <code className="rounded bg-slate-100 px-1 py-0.5">.env.example</code> para <code className="rounded bg-slate-100 px-1 py-0.5">.env.local</code> e preencha as variáveis do seu projeto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
