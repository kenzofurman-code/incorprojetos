import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, QrCode, ScanLine, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../app/useAppData';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input } from '../../components/ui/Field';
import { revisionBadgeClass } from '../../lib/status';
import { revisionStatusLabel } from '../../types/models';

function QrPreview({ value }: { value: string }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(value, { margin: 1, width: 180 }).then((url) => {
      if (mounted) setSrc(url);
    });
    return () => {
      mounted = false;
    };
  }, [value]);

  if (!src) return <div className="h-44 w-44 rounded-2xl bg-slate-100" />;
  return <img alt="QR Code" className="h-44 w-44 rounded-2xl border border-slate-200 bg-white p-2" src={src} />;
}

export function SitePage() {
  const { state, loading, error } = useAppData();
  const [qrInput, setQrInput] = useState('');

  const approvedItems = useMemo(() => {
    if (!state) return [];
    return state.documents
      .map((documentRecord) => {
        const revision = state.revisions.find((item) => item.id === documentRecord.latestApprovedRevisionId || item.id === documentRecord.currentRevisionId);
        if (!revision || revision.status !== 'liberado_obra') return null;
        return { documentRecord, revision };
      })
      .filter(Boolean) as { documentRecord: NonNullable<typeof state>['documents'][number]; revision: NonNullable<typeof state>['revisions'][number] }[];
  }, [state]);

  if (loading) return <p className="text-sm text-slate-500">Carregando módulo de obra...</p>;
  if (error) return <EmptyState title="Erro ao carregar" description={error} />;
  if (!state) return null;

  const disciplinesWithDocs = state.disciplines.map((discipline) => ({
    discipline,
    docs: approvedItems.filter((item) => item.documentRecord.disciplineCode === discipline.code),
  }));

  const qrResult = (() => {
    const [documentId, revisionId] = qrInput.split(':');
    if (!documentId || !revisionId) return null;
    const documentRecord = state.documents.find((item) => item.id === documentId);
    const revision = state.revisions.find((item) => item.id === revisionId);
    if (!documentRecord || !revision) return { ok: false, title: 'QR não encontrado', message: 'O documento ou a revisão não existem nesta base.' };
    if (documentRecord.latestApprovedRevisionId === revision.id && revision.status === 'liberado_obra') {
      return { ok: true, title: 'Prancha atualizada', message: `${documentRecord.code} · ${revision.revisionCode} está liberado para obra.` };
    }
    return { ok: false, title: 'Prancha obsoleta ou não liberada', message: `Existe uma versão vigente diferente para ${documentRecord.code}.` };
  })();

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Uso em obra</h2>
        <p className="text-slate-500">Consulta da última versão aprovada, armário digital, corte vertical e validação por QR Code.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <h3 className="font-bold">Armário de projetos digital</h3>
            <p className="text-sm text-slate-500">Cada espaço representa uma disciplina com documentos liberados para obra.</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {disciplinesWithDocs.map(({ discipline, docs }) => (
                <div key={discipline.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="h-10 w-2 rounded-full" style={{ backgroundColor: discipline.color }} />
                    <div>
                      <p className="font-black">{discipline.code}</p>
                      <p className="text-xs text-slate-500">{discipline.name}</p>
                    </div>
                  </div>
                  {docs.length ? (
                    <div className="grid gap-2">
                      {docs.map(({ documentRecord, revision }) => (
                        <Link key={documentRecord.id} to={`/documentos/${documentRecord.id}`} className="rounded-xl border border-slate-100 p-3 text-sm hover:bg-slate-50">
                          <p className="font-semibold">{documentRecord.code}</p>
                          <p className="mt-1 text-xs text-slate-500">{revision.revisionCode} · {documentRecord.floor || 'sem pavimento'}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Sem documentos liberados.</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Validação por QR Code</h3>
            <p className="text-sm text-slate-500">No protótipo, cole o código no formato documento:revisão.</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Código lido da prancha">
              <Input value={qrInput} onChange={(event) => setQrInput(event.target.value)} placeholder="doc_xxx:rev_xxx" />
            </Field>
            {qrResult ? (
              <div className={`rounded-2xl border p-4 ${qrResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
                <div className="flex items-center gap-2 font-bold">
                  {qrResult.ok ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
                  {qrResult.title}
                </div>
                <p className="mt-2 text-sm">{qrResult.message}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                <ScanLine className="mb-2" size={20} />
                Use o QR gerado em um documento liberado para simular a conferência.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-bold">Corte vertical da edificação</h3>
            <p className="text-sm text-slate-500">Visual por pavimento para aproximar a consulta da lógica de obra.</p>
          </div>
          <Building2 className="text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {['Cobertura', '25', '24', '23', '22', '21', '20', '19', '18', 'Térreo', 'SS1', 'SS2'].map((floor) => {
              const floorDocs = approvedItems.filter((item) => item.documentRecord.floor === floor || item.documentRecord.floor === floor.padStart(2, '0'));
              return (
                <div key={floor} className="grid gap-3 rounded-2xl border border-slate-200 p-3 md:grid-cols-[120px_1fr] md:items-center">
                  <div className="rounded-xl bg-slate-950 px-4 py-3 text-center font-black text-white">{floor}</div>
                  <div className="flex flex-wrap gap-2">
                    {floorDocs.length ? (
                      floorDocs.map(({ documentRecord, revision }) => (
                        <Link key={documentRecord.id} to={`/documentos/${documentRecord.id}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                          <span className="font-semibold">{documentRecord.disciplineCode}</span> · {revision.revisionCode}
                        </Link>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">Sem documentos liberados neste pavimento</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-bold">QR Codes dos documentos liberados</h3>
          <p className="text-sm text-slate-500">Use para testar a conferência de versão vigente.</p>
        </CardHeader>
        <CardContent>
          {approvedItems.length === 0 ? (
            <EmptyState title="Nenhum documento liberado" description="Aprove e libere uma revisão para obra para gerar o QR Code." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {approvedItems.map(({ documentRecord, revision }) => {
                const qrValue = `${documentRecord.id}:${revision.id}`;
                return (
                  <div key={revision.id} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                    <QrPreview value={qrValue} />
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <QrCode size={18} />
                        <Badge className={revisionBadgeClass(revision.status)}>{revisionStatusLabel[revision.status]}</Badge>
                      </div>
                      <p className="font-black">{documentRecord.code}</p>
                      <p className="mt-1 text-sm text-slate-500">{revision.revisionCode}</p>
                      <Button variant="secondary" className="mt-4 px-3 py-1.5 text-xs" onClick={() => setQrInput(qrValue)}>
                        Simular leitura
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
