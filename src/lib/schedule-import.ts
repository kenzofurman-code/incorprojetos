import type { DocumentRecord, ScheduleMilestone } from '../types/models';

type MilestoneImport = Omit<ScheduleMilestone, 'id' | 'status' | 'projectId'>;

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const text = String(value ?? '').trim();
  const brazilian = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilian) return `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return '';
}

export async function parseMilestoneFile(
  file: File,
  documents: DocumentRecord[],
): Promise<{ milestones: MilestoneImport[]; warnings: string[] }> {
  let rows: unknown[][];
  if (file.name.toLowerCase().endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    rows = await readSheet(file);
  } else {
    const text = await file.text();
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    const delimiter = (lines[0]?.match(/;/g)?.length ?? 0) >= (lines[0]?.match(/,/g)?.length ?? 0) ? ';' : ',';
    rows = lines.map((line) => parseCsvLine(line, delimiter));
  }

  if (rows.length < 2) throw new Error('A planilha não possui linhas para importar.');
  const headers = rows[0].map(normalizeHeader);
  const column = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const indexes = {
    title: column('marco', 'titulo', 'title'),
    discipline: column('disciplina', 'codigo_disciplina', 'discipline'),
    construction: column('necessario_obra', 'data_obra', 'necessario_para_obra'),
    promised: column('prometido_projetista', 'data_projetista', 'prometido'),
    responsible: column('responsavel', 'empresa_responsavel', 'projetista'),
    documents: column('documentos', 'codigos_documentos', 'documento'),
  };

  if ([indexes.title, indexes.discipline, indexes.construction, indexes.promised].some((index) => index < 0)) {
    throw new Error('Colunas obrigatórias: marco, disciplina, necessario_obra e prometido_projetista.');
  }

  const warnings: string[] = [];
  const milestones = rows.slice(1).flatMap((row, rowIndex) => {
    const title = String(row[indexes.title] ?? '').trim();
    const disciplineCode = String(row[indexes.discipline] ?? '').trim().toUpperCase();
    const requiredForConstructionDate = toIsoDate(row[indexes.construction]);
    const promisedByDesignerDate = toIsoDate(row[indexes.promised]);
    if (!title || !disciplineCode || !requiredForConstructionDate || !promisedByDesignerDate) {
      warnings.push(`Linha ${rowIndex + 2} ignorada por dados obrigatórios inválidos.`);
      return [];
    }

    const documentCodes = indexes.documents >= 0
      ? String(row[indexes.documents] ?? '').split(/[|;]/).map((code) => code.trim().toLowerCase()).filter(Boolean)
      : [];
    const documentIds = documents
      .filter((documentRecord) => documentCodes.includes(documentRecord.code.toLowerCase()))
      .map((documentRecord) => documentRecord.id);
    const missingCodes = documentCodes.filter((code) => !documents.some((documentRecord) => documentRecord.code.toLowerCase() === code));
    if (missingCodes.length) warnings.push(`Linha ${rowIndex + 2}: documentos não encontrados: ${missingCodes.join(', ')}.`);

    return [{
      title,
      disciplineCode,
      requiredForConstructionDate,
      promisedByDesignerDate,
      responsibleCompany: indexes.responsible >= 0 ? String(row[indexes.responsible] ?? '').trim() : '',
      documentIds,
    }];
  });

  return { milestones, warnings };
}
