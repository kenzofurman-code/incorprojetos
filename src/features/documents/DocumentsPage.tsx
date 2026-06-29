import { Link } from 'react-router-dom';
import { Plus, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/useAppData';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/dates';
import { revisionBadgeClass } from '../../lib/status';
import { phaseLabel, revisionStatusLabel } from '../../types/models';
import { CreateDocumentForm } from './CreateDocumentForm';

export function DocumentsPage() {
  const { state, loading, error, reload } = useAppData();
  const [showCreate, setShowCreate] = useState(false);
  const [disciplineFilter, setDisciplineFilter] = useState('');

  if (loading) return <p className="text-sm text-slate-500">Carregando documentos...</p>;
  if (error) return <EmptyState title="Erro ao carregar" description={error} />;
  if (!state) return null;

  const documents = state.documents.filter((documentRecord) => !disciplineFilter || documentRecord.disciplineCode === disciplineFilter);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Documentos e versões</h2>
          <p className="text-slate-500">Cadastre projetos, controle revisões e libere versões para obra.</p>
        </div>
        <Button onClick={() => setShowCreate((value) => !value)}>
          <Plus size={18} />
          {showCreate ? 'Fechar upload' : 'Novo documento'}
        </Button>
      </div>

      {showCreate ? (
        <CreateDocumentForm disciplines={state.disciplines} projectId={state.currentProjectId} onDone={() => { setShowCreate(false); void reload(); }} />
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-bold">Lista de documentos</h3>
            <p className="text-sm text-slate-500">{documents.length} documento(s) encontrados.</p>
          </div>
          <select
            value={disciplineFilter}
            onChange={(event) => setDisciplineFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todas as disciplinas</option>
            {state.disciplines.map((discipline) => (
              <option key={discipline.id} value={discipline.code}>{`[${discipline.code}] ${discipline.name}`}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <EmptyState
              title="Nenhum documento cadastrado"
              description="Comece enviando um PDF de projeto. O app criará a primeira revisão automaticamente."
              action={<Button onClick={() => setShowCreate(true)}><UploadCloud size={18} /> Fazer upload</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3">Código</th>
                    <th className="pb-3">Título</th>
                    <th className="pb-3">Disciplina</th>
                    <th className="pb-3">Fase</th>
                    <th className="pb-3">Revisão atual</th>
                    <th className="pb-3">Atualizado</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((documentRecord) => {
                    const currentRevision = state.revisions.find((revision) => revision.id === documentRecord.currentRevisionId);
                    return (
                      <tr key={documentRecord.id}>
                        <td className="py-4 font-semibold text-slate-900">{documentRecord.code}</td>
                        <td className="py-4">{documentRecord.title}</td>
                        <td className="py-4">{documentRecord.disciplineCode}</td>
                        <td className="py-4">{phaseLabel[documentRecord.phase]}</td>
                        <td className="py-4">
                          {currentRevision ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{currentRevision.revisionCode}</span>
                              <Badge className={revisionBadgeClass(currentRevision.status)}>{revisionStatusLabel[currentRevision.status]}</Badge>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-4">{formatDate(documentRecord.updatedAt)}</td>
                        <td className="py-4 text-right">
                          <Link className="font-semibold text-slate-950 underline-offset-4 hover:underline" to={`/documentos/${documentRecord.id}`}>
                            Abrir
                          </Link>
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
  );
}
