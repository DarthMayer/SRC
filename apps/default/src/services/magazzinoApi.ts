import axios from 'axios';
import { createNode as createProjectNode, deleteNode as deleteProjectNode, updateNode as updateProjectNode } from '../lib/genesis-data';

export type NodeRow = {
  id: string;
  parentId: string | null;
  content?: string;
  fieldValues?: Record<string, unknown>;
};

export const PROJECTS = {
  casse: '9kdJVdgKjhA4vMej',
  siluri: 'VQ7SifXzUJrCUbwV',
  sacconi: '7o5d8J3zSA98Cqpx',
  sacchi: 'JPEsz6CJgZAphTTt',
  statiCasse: 'r51wY768EqDu1pCC',
  statiSiluri: 'MwZuaxmvBryXCZhq',
  epal: 'TecL6SbRxFU2GGz7',
  scarichi: 'VhVNMZNQqufwVbGV',
  utenti: 'C6F3SRoab37Aypci',
  accessi: 'N1tPzwBinvJcLLM5',
  bilici: 'HwQ8wiozTGs7kgkt',
  centinati: 'hYNjX8gU375LPync',
  impostazioni: 'pTvz41GBZDRXZXZW',
  ripristini: 'a4jEVZG5wd5QD932',
  bolleCarico: 'M1pFaMmokDnnRw2e',
  bolleCaricoSiluri: '7GP6nFbsopWk24yE',
  bolleCaricoSacconi: 'kx3WMmRQPFEC3fgw',
  bolleCaricoSacchi: 'veHbx3q6TckRnuv7',
  mangimi: 'Wvyu7B1zzLLeQani',
  consumiSiluri: '8cieR3QUqyntRzCE',
} as const;

export type ProjectKey = keyof typeof PROJECTS;

const endpoint = (projectId: string) => `/api/taskade/projects/${projectId}/nodes`;

type AuditActor = { name: string; email: string; role: string };
let auditActor: AuditActor = { name: 'Utente', email: '', role: '' };

export function setAuditActor(actor: AuditActor) {
  auditActor = { name: actor.name.trim() || 'Utente', email: actor.email.trim().toLowerCase(), role: actor.role.trim() };
}

const auditInfo: Partial<Record<ProjectKey, { label: string; warehouse: string; code?: string; product?: string; lot?: string; ddt?: string }>> = {
  casse: { label: 'Casse', warehouse: 'casse', code: '@cas01', product: '@cas02', lot: '@cas03', ddt: '@cas05' },
  siluri: { label: 'Siluri', warehouse: 'siluri', code: '@sil01', product: '@sil02', lot: '@sil03', ddt: '@sil05' },
  sacconi: { label: 'Sacconi', warehouse: 'sacconi', code: '@sac01', product: '@sac02', lot: '@sac03', ddt: '@sac05' },
  sacchi: { label: 'Sacchi', warehouse: 'sacchi', code: '@stk01', product: '@stk02', lot: '@stk03', ddt: '@stk05' },
  scarichi: { label: 'Programma carichi', warehouse: 'programma', code: '@sca02', product: '@sca03' },
  epal: { label: 'EPAL', warehouse: 'epal', ddt: '@epa02' },
  utenti: { label: 'Utenti', warehouse: 'utenti' },
  impostazioni: { label: 'Impostazioni', warehouse: 'impostazioni' },
};

function projectKey(projectId: string): ProjectKey | undefined {
  return Object.entries(PROJECTS).find(([, id]) => id === projectId)?.[0] as ProjectKey | undefined;
}

function valueFrom(values: Record<string, unknown>, id?: string) {
  if (!id) return '';
  const bare = id.startsWith('@') ? id.slice(1) : id;
  const value = values[`/attributes/${id}`] ?? values[`/attributes/@${bare}`] ?? values[id] ?? values[bare] ?? '';
  return value && typeof value === 'object' && 'optionId' in value ? String((value as { optionId: string }).optionId) : String(value ?? '').trim();
}

async function logActivity(projectId: string, operation: string, values: Record<string, unknown>, extra = '') {
  if (projectId === PROJECTS.accessi) return;
  const key = projectKey(projectId);
  const info = (key ? auditInfo[key] : undefined) ?? { label: 'Gestionale', warehouse: 'altro' };
  const code = valueFrom(values, info.code);
  const product = valueFrom(values, info.product) || code;
  const changed = Object.entries(values).filter(([key, value]) => key !== '/text' && !/password|token|secret/i.test(key) && value !== '' && value != null).map(([key, value]) => `${key.split('/').pop()}: ${String(value)}`).join(' · ');
  const payload: Record<string, string | number | boolean> = {
    '/text': `${auditActor.name} · ${operation} · ${info.label}`,
    '/attributes/@acc01': auditActor.email,
    '/attributes/@acc02': auditActor.name,
    '/attributes/@acc03': new Date().toISOString(),
    '/attributes/@acc04': 'accesso',
    '/attributes/@acc05': 'Gestionale SARDEGNA',
    '/attributes/@acc06': `${operation} ${info.label}`,
    '/attributes/@acc07': valueFrom(values, info.ddt),
    '/attributes/@acc08': product,
    '/attributes/@acc09': valueFrom(values, info.lot),
    '/attributes/@acc10': info.warehouse,
    '/attributes/@acc11': [String(values['/text'] ?? ''), changed, extra].filter(Boolean).join(' · ').slice(0, 1800) || operation,
  };
  Object.keys(payload).forEach((key) => { if (typeof payload[key] === 'string' && !String(payload[key]).trim()) delete payload[key]; });
  const { ignoredKeys } = await createProjectNode(PROJECTS.accessi, payload);
  if (ignoredKeys.length > 0) throw new Error(`Campi del registro non riconosciuti: ${ignoredKeys.join(', ')}`);
}

async function logActivitySafely(projectId: string, operation: string, values: Record<string, unknown>, extra = '') {
  try { await logActivity(projectId, operation, values, extra); }
  catch { if (typeof window !== 'undefined') window.dispatchEvent(new Event('magazzino:audit-write-failed')); }
}

const sensitiveFields: Record<string, string[]> = {
  [PROJECTS.casse]: ['@cas03', '@cas06'],
  [PROJECTS.siluri]: ['@sil03', '@sil06'],
  [PROJECTS.sacconi]: ['@sac03', '@sac06'],
  [PROJECTS.sacchi]: ['@stk03', '@stk06'],
};

function confirmSensitiveUpdate(projectId: string, values: Record<string, unknown>) {
  const changed = Object.keys(values).some((key) => (sensitiveFields[projectId] ?? []).some((fieldId) => key.endsWith(fieldId)));
  if (changed && typeof window !== 'undefined' && !window.confirm('Conferma la modifica sensibile di quantità o lotto? La giacenza verrà aggiornata.')) throw new Error('Modifica annullata.');
}

async function snapshotBeforeDelete(projectId: string, nodeId: string) {
  try {
    const row = (await getNodes(projectId)).find((item) => item.id === nodeId);
    return row ? { ...(row.fieldValues ?? {}), '/text': row.content ?? '' } : {};
  } catch { return {}; }
}

export function activityDateKey(value: unknown) {
  const date = new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Rome' }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function activityDateLabel(value: unknown) {
  const date = new Date(String(value ?? ''));
  return Number.isNaN(date.getTime()) ? String(value ?? '') : new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(date);
}

export function allowedForExport(role: string, staffGrant: boolean) {
  return role === 'admin' || (role === 'staff' && staffGrant);
}

export function exportPermissionValue(row: NodeRow | undefined) {
  return selectValue(field(row, '@4f10a')).toLowerCase() === 'on';
}

export function activityAuditErrorText() {
  return 'Operazione salvata, ma il registro attività non è stato aggiornato. Avvisa l’amministratore.';
}


export async function getNodes(projectId: string): Promise<NodeRow[]> {
  const response = await axios.get(endpoint(projectId));
  return response.data?.payload?.nodes ?? [];
}

export async function createNode(projectId: string, values: Record<string, unknown>) {
  const response = await axios.post(endpoint(projectId), values);
  const ignoredKeys = response.data?.payload?.ignoredKeys ?? [];
  if (ignoredKeys.length > 0) throw new Error(`Campi non riconosciuti: ${ignoredKeys.join(', ')}`);
  await logActivitySafely(projectId, 'Registrazione', values);
  return response.data?.payload?.node;
}

export async function updateNode(projectId: string, nodeId: string, values: Record<string, unknown>) {
  confirmSensitiveUpdate(projectId, values);
  const response = await axios.patch(`${endpoint(projectId)}/${nodeId}`, values);
  const ignoredKeys = response.data?.payload?.ignoredKeys ?? [];
  if (ignoredKeys.length > 0) throw new Error(`Campi non riconosciuti: ${ignoredKeys.join(', ')}`);
  await logActivitySafely(projectId, 'Modifica', values);
  return response.data?.payload?.node;
}

export async function deleteNode(projectId: string, nodeId: string) {
  const snapshot = await snapshotBeforeDelete(projectId, nodeId);
  await axios.delete(`${endpoint(projectId)}/${nodeId}`);
  await logActivitySafely(projectId, 'Eliminazione', snapshot, `Riga ${nodeId}`);
}

function ensureRecognizedFields(ignoredKeys: string[]) {
  if (ignoredKeys.length > 0) throw new Error(`Campi non riconosciuti: ${ignoredKeys.join(', ')}`);
}

export async function createReservation(values: Record<string, string | number | boolean>) {
  const { ignoredKeys } = await createProjectNode(PROJECTS.scarichi, values);
  ensureRecognizedFields(ignoredKeys);
  await logActivitySafely(PROJECTS.scarichi, 'Registrazione', values);
}

export async function updateReservation(nodeId: string, values: Record<string, string | number | boolean>) {
  const { ignoredKeys } = await updateProjectNode(PROJECTS.scarichi, nodeId, values);
  ensureRecognizedFields(ignoredKeys);
  await logActivitySafely(PROJECTS.scarichi, 'Modifica', values);
}

export async function deleteReservation(nodeId: string) {
  const snapshot = await snapshotBeforeDelete(PROJECTS.scarichi, nodeId);
  await deleteProjectNode(PROJECTS.scarichi, nodeId);
  await logActivitySafely(PROJECTS.scarichi, 'Eliminazione', snapshot, `Riga ${nodeId}`);
}

export function field(row: NodeRow | undefined, name: string): unknown {
  if (!row) return undefined;
  return row.fieldValues?.[name] ?? row.fieldValues?.[`/attributes/${name}`] ?? row.fieldValues?.[`/attributes/@${name}`];
}

export function title(row: NodeRow): string {
  return String(row.content ?? row.fieldValues?.['/text'] ?? 'Riga senza descrizione');
}

const optionAliases: Record<string, string> = {
  'Vuota': 'vuota',
  'Modugno': 'modugno',
  'Salerno': 'salerno',
  'In transito': 'transito',
  'Porto Cagliari': 'porto',
  'Deposito/Cliente': 'deposito',
  'Spedita': 'spedita',
  'Rientrata': 'rientrata',
  'In attesa': 'in-attesa',
  'Approvato': 'approvato',
  'Rifiutato': 'rifiutato',
  'Titolare': 'titolare',
  'Staff': 'staff',
  'Sola lettura': 'lettura',
  'AGRISTAR': 'agristar',
  'AGRISTAR/FODDI': 'agristar-foddi',
  'Programmato': 'programmato',
  'Confermato': 'confermato',
  'Scaricato': 'scaricato',
  'Annullato': 'annullato',
};

export function selectValue(value: unknown): string {
  const raw = value && typeof value === 'object' && 'optionId' in value
    ? String((value as { optionId: string }).optionId)
    : String(value ?? '');
  return optionAliases[raw] ?? raw;
}

export function numeric(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function metricTons(value: unknown): number {
  return Math.round((numeric(value) / 10) * 100) / 100;
}

export function formatMetricTons(value: unknown): string {
  return metricTons(value).toLocaleString('it-IT', { maximumFractionDigits: 2 });
}
