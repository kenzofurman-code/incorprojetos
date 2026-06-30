import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, firebaseEnabled } from '../firebase/config';
import { supabase, supabaseEnabled } from '../supabase/config';
import type {
  AppState,
  Discipline,
  DocumentRecord,
  DocumentRevision,
  Issue,
  PrintRequest,
  Project,
  RevisionStatus,
  ScheduleMilestone,
} from '../types/models';
import { fileToDataUrl } from './file';
import { makeId } from './id';
import { seedState } from './seed';

const LOCAL_KEY = 'incorprojetos:v1';

function cloneSeed(): AppState {
  return JSON.parse(JSON.stringify(seedState)) as AppState;
}

function getLocalState(): AppState {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) {
    const seeded = cloneSeed();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw) as AppState;
}

function saveLocalState(state: AppState): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

function activeProjectId(): string {
  return getLocalState().currentProjectId;
}

async function uploadFile(projectId: string, documentId: string, revisionCode: string, file: File): Promise<{ url: string; path?: string }> {
  if (firebaseEnabled && supabaseEnabled && supabase && auth?.currentUser) {
    if (file.type !== 'application/pdf' || file.size > 25 * 1024 * 1024) {
      throw new Error('Envie um arquivo PDF de até 25 MB.');
    }

    const idToken = await auth.currentUser.getIdToken();
    const authorizationResponse = await fetch('/api/upload-url', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        documentId,
        revisionCode,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });
    const authorization = (await authorizationResponse.json()) as {
      path?: string;
      token?: string;
      publicUrl?: string;
      error?: string;
    };
    if (!authorizationResponse.ok || !authorization.path || !authorization.token || !authorization.publicUrl) {
      throw new Error(authorization.error || 'Não foi possível autorizar o upload.');
    }

    const { error } = await supabase.storage
      .from(import.meta.env.VITE_SUPABASE_BUCKET || 'project-files')
      .uploadToSignedUrl(authorization.path, authorization.token, file, {
        contentType: 'application/pdf',
      });
    if (error) throw new Error(`Falha no upload: ${error.message}`);
    return { url: authorization.publicUrl, path: authorization.path };
  }

  if (firebaseEnabled) {
    throw new Error('Supabase Storage não está configurado neste ambiente.');
  }

  return { url: await fileToDataUrl(file) };
}

async function listCollection<T>(name: string): Promise<T[]> {
  if (!firebaseEnabled || !db) return [];
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

async function listCollectionByProject<T>(name: string, projectId: string): Promise<T[]> {
  if (!firebaseEnabled || !db) return [];
  const snap = await getDocs(query(collection(db, name), where('projectId', '==', projectId)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export const repository = {
  mode: firebaseEnabled ? 'firebase' : 'demo-local',

  async loadAppState(): Promise<AppState> {
    if (!firebaseEnabled || !db) return getLocalState();
    const firestore = db;

    const projects = await listCollection<Project>('projects');
    if (projects.length === 0) {
      const seeded = cloneSeed();
      await this.seedFirebase(seeded);
      return seeded;
    }

    const projectId = projects[0].id;
    const [disciplines, milestones, documents, issues, printRequests] = await Promise.all([
      listCollection<Discipline>('disciplines'),
      listCollectionByProject<ScheduleMilestone>('milestones', projectId),
      listCollectionByProject<DocumentRecord>('documents', projectId),
      listCollectionByProject<Issue>('issues', projectId),
      listCollectionByProject<PrintRequest>('printRequests', projectId),
    ]);

    const revisions = documents.length
      ? (await Promise.all(
          documents.map(async (documentRecord) => {
            const snap = await getDocs(query(collection(firestore, 'revisions'), where('documentId', '==', documentRecord.id)));
            return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as DocumentRevision);
          }),
        )).flat()
      : [];

    return {
      currentProjectId: projectId,
      projects,
      disciplines,
      milestones,
      documents,
      revisions,
      issues,
      printRequests,
    };
  },

  async seedFirebase(state: AppState): Promise<void> {
    if (!firebaseEnabled || !db) return;
    const firestore = db;
    await Promise.all([
      ...state.projects.map((item) => setDoc(doc(firestore, 'projects', item.id), item)),
      ...state.disciplines.map((item) => setDoc(doc(firestore, 'disciplines', item.id), item)),
      ...state.milestones.map((item) => setDoc(doc(firestore, 'milestones', item.id), item)),
      ...state.documents.map((item) => setDoc(doc(firestore, 'documents', item.id), item)),
      ...state.revisions.map((item) => setDoc(doc(firestore, 'revisions', item.id), item)),
      ...state.issues.map((item) => setDoc(doc(firestore, 'issues', item.id), item)),
      ...state.printRequests.map((item) => setDoc(doc(firestore, 'printRequests', item.id), item)),
    ]);
  },

  async resetDemo(): Promise<AppState> {
    const seeded = cloneSeed();
    saveLocalState(seeded);
    return seeded;
  },

  async upsertDiscipline(input: Omit<Discipline, 'id'> & { id?: string }): Promise<Discipline> {
    const item: Discipline = { id: input.id ?? makeId('disc'), code: input.code.toUpperCase(), name: input.name, color: input.color };
    if (firebaseEnabled && db) {
      await setDoc(doc(db, 'disciplines', item.id), item);
      return item;
    }
    const state = getLocalState();
    const index = state.disciplines.findIndex((discipline) => discipline.id === item.id);
    if (index >= 0) state.disciplines[index] = item;
    else state.disciplines.push(item);
    saveLocalState(state);
    return item;
  },

  async deleteDiscipline(id: string): Promise<void> {
    if (firebaseEnabled && db) {
      await deleteDoc(doc(db, 'disciplines', id));
      return;
    }
    const state = getLocalState();
    state.disciplines = state.disciplines.filter((item) => item.id !== id);
    saveLocalState(state);
  },

  async createDocumentWithRevision(input: {
    projectId?: string;
    code: string;
    title: string;
    disciplineCode: string;
    phase: DocumentRecord['phase'];
    block?: string;
    floor?: string;
    area?: string;
    revisionCode: string;
    notes?: string;
    file: File;
    uploadedBy: string;
  }): Promise<{ documentRecord: DocumentRecord; revision: DocumentRevision }> {
    const now = new Date().toISOString();
    const documentId = makeId('doc');
    const projectId = input.projectId ?? activeProjectId();
    const upload = await uploadFile(projectId, documentId, input.revisionCode, input.file);
    const revisionId = makeId('rev');

    const documentRecord: DocumentRecord = {
      id: documentId,
      projectId,
      code: input.code,
      title: input.title,
      disciplineCode: input.disciplineCode,
      phase: input.phase,
      block: input.block,
      floor: input.floor,
      area: input.area,
      currentRevisionId: revisionId,
      createdAt: now,
      updatedAt: now,
    };

    const revision: DocumentRevision = {
      id: revisionId,
      documentId,
      revisionCode: input.revisionCode.toUpperCase(),
      fileName: input.file.name,
      fileUrl: upload.url,
      storagePath: upload.path,
      uploadedBy: input.uploadedBy,
      uploadedAt: now,
      status: 'em_revisao',
      notes: input.notes,
    };

    if (firebaseEnabled && db) {
      await Promise.all([
        setDoc(doc(db, 'documents', documentId), documentRecord),
        setDoc(doc(db, 'revisions', revisionId), revision),
      ]);
      return { documentRecord, revision };
    }

    const state = getLocalState();
    state.documents.push(documentRecord);
    state.revisions.push(revision);
    saveLocalState(state);
    return { documentRecord, revision };
  },

  async addRevision(documentId: string, revisionCode: string, file: File, uploadedBy: string, notes?: string): Promise<DocumentRevision> {
    const state = await this.loadAppState();
    const documentRecord = state.documents.find((item) => item.id === documentId);
    if (!documentRecord) throw new Error('Documento não encontrado.');

    const now = new Date().toISOString();
    const upload = await uploadFile(documentRecord.projectId, documentId, revisionCode, file);
    const revision: DocumentRevision = {
      id: makeId('rev'),
      documentId,
      revisionCode: revisionCode.toUpperCase(),
      fileName: file.name,
      fileUrl: upload.url,
      storagePath: upload.path,
      uploadedBy,
      uploadedAt: now,
      status: 'em_revisao',
      notes,
    };

    const updatedDocument = { ...documentRecord, currentRevisionId: revision.id, updatedAt: now };

    if (firebaseEnabled && db) {
      await Promise.all([
        setDoc(doc(db, 'revisions', revision.id), revision),
        updateDoc(doc(db, 'documents', documentId), updatedDocument),
      ]);
      return revision;
    }

    const localState = getLocalState();
    localState.revisions.push(revision);
    localState.documents = localState.documents.map((item) => (item.id === documentId ? updatedDocument : item));
    saveLocalState(localState);
    return revision;
  },

  async updateRevisionStatus(revisionId: string, status: RevisionStatus, userName = 'Coordenador'): Promise<void> {
    const now = new Date().toISOString();
    const state = await this.loadAppState();
    const revision = state.revisions.find((item) => item.id === revisionId);
    if (!revision) throw new Error('Revisão não encontrada.');
    const documentRecord = state.documents.find((item) => item.id === revision.documentId);
    if (!documentRecord) throw new Error('Documento não encontrado.');

    const revisionUpdate: Partial<DocumentRevision> = { status };
    const documentUpdate: Partial<DocumentRecord> = { updatedAt: now };

    if (status === 'aprovado' || status === 'liberado_obra') {
      revisionUpdate.approvedAt = revision.approvedAt ?? now;
      revisionUpdate.approvedBy = revision.approvedBy ?? userName;
      documentUpdate.latestApprovedRevisionId = revisionId;
    }

    if (status === 'liberado_obra') {
      revisionUpdate.releasedForSiteAt = now;
    }

    if (status === 'obsoleto') {
      revisionUpdate.obsoleteAt = now;
    }

    if (firebaseEnabled && db) {
      await Promise.all([
        updateDoc(doc(db, 'revisions', revisionId), revisionUpdate),
        updateDoc(doc(db, 'documents', documentRecord.id), documentUpdate),
      ]);
      return;
    }

    const localState = getLocalState();
    localState.revisions = localState.revisions.map((item) => (item.id === revisionId ? { ...item, ...revisionUpdate } : item));
    localState.documents = localState.documents.map((item) => (item.id === documentRecord.id ? { ...item, ...documentUpdate } : item));
    saveLocalState(localState);
  },

  async createIssue(input: Omit<Issue, 'id' | 'createdAt'>): Promise<Issue> {
    const issue: Issue = { ...input, id: makeId('issue'), createdAt: new Date().toISOString() };
    if (firebaseEnabled && db) {
      await setDoc(doc(db, 'issues', issue.id), issue);
      return issue;
    }
    const state = getLocalState();
    state.issues.push(issue);
    saveLocalState(state);
    return issue;
  },

  async updateIssueStatus(issueId: string, status: Issue['status']): Promise<void> {
    if (firebaseEnabled && db) {
      await updateDoc(doc(db, 'issues', issueId), { status });
      return;
    }
    const state = getLocalState();
    state.issues = state.issues.map((item) => (item.id === issueId ? { ...item, status } : item));
    saveLocalState(state);
  },

  async createPrintRequest(input: Omit<PrintRequest, 'id' | 'createdAt' | 'status'>): Promise<PrintRequest> {
    const request: PrintRequest = { ...input, id: makeId('print'), createdAt: new Date().toISOString(), status: 'solicitado' };
    if (firebaseEnabled && db) {
      await addDoc(collection(db, 'printRequests'), request);
      return request;
    }
    const state = getLocalState();
    state.printRequests.push(request);
    saveLocalState(state);
    return request;
  },
};
