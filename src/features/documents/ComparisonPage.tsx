import { ArrowLeft, ChevronLeft, ChevronRight, FlaskConical, Layers3 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppData } from '../../app/useAppData';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input, Select } from '../../components/ui/Field';
import { createDifferenceCanvas, renderPdfPage, tintDrawing, type RenderedPdfPage } from '../../lib/pdf-comparison';

type ComparisonMode = 'side' | 'overlay' | 'split' | 'difference';

function CanvasView({ source, className = '' }: { source: HTMLCanvasElement; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext('2d')?.drawImage(source, 0, 0);
  }, [source]);
  return <canvas className={`block h-auto w-full bg-white ${className}`} ref={ref} />;
}

export function ComparisonPage() {
  const { documentId } = useParams();
  const { state, loading: dataLoading, error: dataError } = useAppData();
  const revisions = useMemo(
    () => (state?.revisions.filter((revision) => (!documentId || revision.documentId === documentId) && revision.fileUrl) ?? [])
      .sort((first, second) => first.uploadedAt.localeCompare(second.uploadedAt)),
    [documentId, state],
  );
  const documentRecord = state?.documents.find((item) => item.id === documentId);
  const contextualComparison = Boolean(documentId);
  const [firstId, setFirstId] = useState('');
  const [secondId, setSecondId] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [mode, setMode] = useState<ComparisonMode>('overlay');
  const [firstColor, setFirstColor] = useState('#ef4444');
  const [secondColor, setSecondColor] = useState('#2563eb');
  const [firstOpacity, setFirstOpacity] = useState(70);
  const [secondOpacity, setSecondOpacity] = useState(70);
  const [divider, setDivider] = useState(50);
  const [threshold, setThreshold] = useState(35);
  const [hideText, setHideText] = useState(false);
  const [firstPage, setFirstPage] = useState<RenderedPdfPage | null>(null);
  const [secondPage, setSecondPage] = useState<RenderedPdfPage | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (revisions.length < 2 || firstId || secondId) return;
    setFirstId(revisions.at(-2)!.id);
    setSecondId(revisions.at(-1)!.id);
  }, [firstId, revisions, secondId]);

  const firstRevision = revisions.find((revision) => revision.id === firstId);
  const secondRevision = revisions.find((revision) => revision.id === secondId);
  const firstDocument = state?.documents.find((item) => item.id === firstRevision?.documentId);
  const secondDocument = state?.documents.find((item) => item.id === secondRevision?.documentId);

  function revisionLabel(revision: (typeof revisions)[number]): string {
    const owner = state?.documents.find((item) => item.id === revision.documentId);
    return owner
      ? `${owner.disciplineCode} · ${owner.code} · ${revision.revisionCode}`
      : `${revision.revisionCode} · ${revision.fileName}`;
  }

  useEffect(() => {
    if (!firstRevision?.fileUrl || !secondRevision?.fileUrl) return;
    let cancelled = false;
    setRendering(true);
    setRenderError(null);
    Promise.all([
      renderPdfPage(firstRevision.fileUrl, pageNumber, hideText),
      renderPdfPage(secondRevision.fileUrl, pageNumber, hideText),
    ])
      .then(([first, second]) => {
        if (!cancelled) {
          setFirstPage(first);
          setSecondPage(second);
        }
      })
      .catch((error) => {
        if (!cancelled) setRenderError(error instanceof Error ? error.message : 'Não foi possível renderizar os PDFs.');
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firstRevision?.fileUrl, hideText, pageNumber, secondRevision?.fileUrl]);

  const firstTinted = useMemo(() => firstPage ? tintDrawing(firstPage.canvas, firstColor) : null, [firstColor, firstPage]);
  const secondTinted = useMemo(() => secondPage ? tintDrawing(secondPage.canvas, secondColor) : null, [secondColor, secondPage]);
  const difference = useMemo(
    () => firstPage && secondPage ? createDifferenceCanvas(firstPage.canvas, secondPage.canvas, threshold) : null,
    [firstPage, secondPage, threshold],
  );
  const pageCount = Math.min(firstPage?.pageCount ?? 1, secondPage?.pageCount ?? 1);
  useEffect(() => {
    if (pageNumber > pageCount) setPageNumber(pageCount);
  }, [pageCount, pageNumber]);

  if (dataLoading) return <p className="text-sm text-slate-500">Carregando comparação...</p>;
  if (dataError) return <EmptyState title="Erro ao carregar" description={dataError} />;
  if (!state || (contextualComparison && !documentRecord)) return <EmptyState title="Documento não encontrado" description="Volte para a lista de documentos." />;
  if (revisions.length < 2) {
    return (
      <EmptyState
        title="São necessários dois PDFs"
        description={contextualComparison ? 'Envie pelo menos duas revisões neste documento.' : 'Cadastre pelo menos dois documentos ou revisões para utilizar a compatibilização.'}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        {documentRecord && (
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" to={`/documentos/${documentRecord.id}`}>
            <ArrowLeft size={16} /> Voltar ao documento
          </Link>
        )}
        <h2 className="text-3xl font-black tracking-tight">{contextualComparison ? 'Comparar revisões' : 'Compatibilização de projetos'}</h2>
        <p className="text-slate-500">
          {documentRecord
            ? `${documentRecord.code} · sobreposição e análise visual de alterações.`
            : 'Compare revisões ou sobreponha projetos de disciplinas diferentes.'}
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 xl:grid-cols-4">
          <Field label="Revisão base">
            <Select value={firstId} onChange={(event) => { setFirstId(event.target.value); setPageNumber(1); }}>
              {revisions.map((revision) => <option key={revision.id} value={revision.id}>{revisionLabel(revision)}</option>)}
            </Select>
          </Field>
          <Field label="Revisão comparada">
            <Select value={secondId} onChange={(event) => { setSecondId(event.target.value); setPageNumber(1); }}>
              {revisions.map((revision) => <option key={revision.id} value={revision.id}>{revisionLabel(revision)}</option>)}
            </Select>
          </Field>
          <Field label="Modo">
            <Select value={mode} onChange={(event) => setMode(event.target.value as ComparisonMode)}>
              <option value="overlay">Sobreposição</option>
              <option value="split">Divisor deslizante</option>
              <option value="side">Lado a lado</option>
              <option value="difference">Destacar diferenças</option>
            </Select>
          </Field>
          <div className="flex items-end justify-center gap-2">
            <Button disabled={pageNumber <= 1 || rendering} onClick={() => setPageNumber((page) => page - 1)} type="button" variant="secondary"><ChevronLeft size={17} /></Button>
            <span className="min-w-20 text-center text-sm font-semibold">Página {pageNumber}/{pageCount}</span>
            <Button disabled={pageNumber >= pageCount || rendering} onClick={() => setPageNumber((page) => page + 1)} type="button" variant="secondary"><ChevronRight size={17} /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-bold">Controles visuais</h3>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label={`Cor e opacidade ${firstRevision?.revisionCode}`}>
            <div className="flex gap-2">
              <Input className="w-16 p-1" type="color" value={firstColor} onChange={(event) => setFirstColor(event.target.value)} />
              <Input max={100} min={0} type="range" value={firstOpacity} onChange={(event) => setFirstOpacity(Number(event.target.value))} />
            </div>
          </Field>
          <Field label={`Cor e opacidade ${secondRevision?.revisionCode}`}>
            <div className="flex gap-2">
              <Input className="w-16 p-1" type="color" value={secondColor} onChange={(event) => setSecondColor(event.target.value)} />
              <Input max={100} min={0} type="range" value={secondOpacity} onChange={(event) => setSecondOpacity(Number(event.target.value))} />
            </div>
          </Field>
          {mode === 'split' && <Field label={`Posição do divisor: ${divider}%`}><Input max={100} min={0} type="range" value={divider} onChange={(event) => setDivider(Number(event.target.value))} /></Field>}
          {mode === 'difference' && <Field label={`Sensibilidade: ${threshold}`}><Input max={100} min={5} type="range" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></Field>}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <input checked={hideText} onChange={(event) => setHideText(event.target.checked)} type="checkbox" />
            <span><strong>Ocultar textos</strong><br /><span className="text-xs">Experimental</span></span>
            <FlaskConical className="ml-auto" size={18} />
          </label>
        </CardContent>
      </Card>

      {renderError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{renderError}</div>}
      {hideText && firstPage && secondPage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Remoção experimental: {firstPage.textItemsRemoved + secondPage.textItemsRemoved} bloco(s) de texto detectados. Textos vetorizados ou rasterizados permanecem.
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="font-bold">Área de comparação</h3>
            <p className="text-sm text-slate-500">
              {rendering
                ? 'Renderizando páginas...'
                : `${firstDocument?.disciplineCode ?? ''} ${firstRevision?.revisionCode} × ${secondDocument?.disciplineCode ?? ''} ${secondRevision?.revisionCode}`}
            </p>
          </div>
          <Layers3 className="text-slate-400" />
        </CardHeader>
        <CardContent>
          {firstPage && secondPage && firstTinted && secondTinted ? (
            <>
              {mode === 'side' && (
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="overflow-auto rounded-2xl border border-slate-200"><CanvasView source={firstPage.canvas} /></div>
                  <div className="overflow-auto rounded-2xl border border-slate-200"><CanvasView source={secondPage.canvas} /></div>
                </div>
              )}
              {mode === 'overlay' && (
                <div className="relative mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white" style={{ aspectRatio: `${firstPage.canvas.width}/${firstPage.canvas.height}` }}>
                  <div className="absolute inset-0" style={{ opacity: firstOpacity / 100 }}><CanvasView source={firstTinted} /></div>
                  <div className="absolute inset-0" style={{ opacity: secondOpacity / 100 }}><CanvasView source={secondTinted} /></div>
                </div>
              )}
              {mode === 'split' && (
                <div className="relative mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white" style={{ aspectRatio: `${firstPage.canvas.width}/${firstPage.canvas.height}` }}>
                  <CanvasView className="absolute inset-0" source={firstPage.canvas} />
                  <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - divider}% 0 0)` }}><CanvasView source={secondPage.canvas} /></div>
                  <div className="absolute inset-y-0 w-0.5 bg-slate-950 shadow-lg" style={{ left: `${divider}%` }} />
                </div>
              )}
              {mode === 'difference' && difference && (
                <div className="mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white"><CanvasView source={difference} /></div>
              )}
            </>
          ) : (
            <div className="grid min-h-96 place-items-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">
              {rendering ? 'Preparando comparação...' : 'Selecione duas revisões.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
