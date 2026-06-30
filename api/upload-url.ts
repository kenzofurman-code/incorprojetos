import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface ApiRequest {
  method?: string;
  headers: { authorization?: string };
  body: unknown;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

async function verifyFirebaseToken(token: string): Promise<boolean> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('VITE_FIREBASE_API_KEY não configurada no servidor.');

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });

  if (!response.ok) return false;
  const payload = (await response.json()) as { users?: unknown[] };
  return Boolean(payload.users?.length);
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const bearer = request.headers.authorization;
    const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : '';
    if (!token || !(await verifyFirebaseToken(token))) {
      return response.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }

    const { projectId, documentId, revisionCode, fileName, contentType, size } = request.body as Record<string, unknown>;
    if (
      typeof projectId !== 'string' ||
      typeof documentId !== 'string' ||
      typeof revisionCode !== 'string' ||
      typeof fileName !== 'string' ||
      contentType !== 'application/pdf' ||
      typeof size !== 'number'
    ) {
      return response.status(400).json({ error: 'Dados do arquivo inválidos.' });
    }
    if (size <= 0 || size > MAX_FILE_SIZE) {
      return response.status(400).json({ error: 'O PDF deve ter no máximo 25 MB.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_BUCKET || 'project-files';
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase não configurado no servidor.');
    }

    const extension = fileName.toLowerCase().endsWith('.pdf') ? '.pdf' : '';
    const path = [
      'projects',
      safeSegment(projectId),
      'documents',
      safeSegment(documentId),
      `${safeSegment(revisionCode)}-${randomUUID()}${extension}`,
    ].join('/');

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw error;

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    return response.status(200).json({
      path,
      token: data.token,
      publicUrl: publicData.publicUrl,
    });
  } catch (error) {
    console.error('Falha ao autorizar upload:', error instanceof Error ? error.message : error);
    return response.status(500).json({ error: 'Não foi possível preparar o upload.' });
  }
}
