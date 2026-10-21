import * as React from 'react';
import { Pencil, Plus, Save, ShieldAlert, Trash2, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { createNode, deleteNode, field, selectValue, title, updateNode, type NodeRow, PROJECTS } from '../services/magazzinoApi';

const roleOptions = [
  { value: 'admin', label: 'ADMIN' },
  { value: 'staff', label: 'STAFF' },
  { value: 'titolare', label: 'TITOLARE' },
  { value: 'agente', label: 'AGENTI' },
  { value: 'trans-isole', label: 'TRANS ISOLE' },
  { value: 'ospite', label: 'OSPITE' },
];
const accessOptions = [
  { value: 'in-attesa', label: 'In attesa' },
  { value: 'approvato', label: 'Approvato' },
  { value: 'rifiutato', label: 'Declinato' },
];

type Props = { rows: NodeRow[]; isAdmin: boolean; onRefresh: () => Promise<void> };
type UserDraft = { email: string; name: string; presentation: string; status: string; role: string };

function draftFrom(row: NodeRow): UserDraft {
  return { email: String(field(row, '@usr01') ?? ''), name: String(field(row, '@usr02') ?? ''), presentation: String(field(row, '@usr05') ?? ''), status: selectValue(field(row, '@usr03')) || 'in-attesa', role: selectValue(field(row, '@usr04')) || 'ospite' };
}

function targetIsProtected(row: NodeRow) {
  return selectValue(field(row, '@usr04')) === 'admin';
}

export function AdminUsersConsole({ rows, isAdmin, onRefresh }: Props) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<UserDraft>({ email: '', name: '', presentation: '', status: 'in-attesa', role: 'ospite' });
  const [showCreate, setShowCreate] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState<UserDraft>({ email: '', name: '', presentation: '', status: 'in-attesa', role: 'ospite' });
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const canManageRow = (_row: NodeRow) => isAdmin;
  const availableRoles = roleOptions;

  const beginEdit = (row: NodeRow) => { if (!canManageRow(row)) return; setEditingId(row.id); setDraft(draftFrom(row)); setShowCreate(false); };
  const saveUser = async (row: NodeRow) => {
    if (!canManageRow(row) || !draft.email.trim() || !draft.name.trim()) return;
    setBusyId(row.id);
    try {
      await updateNode(PROJECTS.utenti, row.id, { '/text': `${draft.email.trim()} - ${draft.name.trim()}`, '/attributes/@usr01': draft.email.trim().toLowerCase(), '/attributes/@usr02': draft.name.trim(), '/attributes/@usr03': draft.status, '/attributes/@usr04': draft.role, '/attributes/@usr05': draft.presentation.trim() });
      setEditingId(null); toast.success('Account aggiornato.'); await onRefresh();
    } catch { toast.error('L’account non è stato aggiornato.'); } finally { setBusyId(null); }
  };
  const deleteUser = async (row: NodeRow) => {
    if (!canManageRow(row) || !window.confirm(`Cancellare l’account ${String(field(row, '@usr01') ?? title(row))}?`)) return;
    setBusyId(row.id);
    try { await deleteNode(PROJECTS.utenti, row.id); toast.success('Account cancellato.'); await onRefresh(); }
    catch { toast.error('L’account non è stato cancellato.'); } finally { setBusyId(null); }
  };
  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createDraft.email.trim() || !createDraft.name.trim() || !createDraft.presentation.trim()) return;
    if (!isAdmin || !roleOptions.some((option) => option.value === createDraft.role)) return;
    setBusyId('new');
    try {
      await createNode(PROJECTS.utenti, { '/text': `${createDraft.email.trim()} - ${createDraft.name.trim()}`, '/attributes/@usr01': createDraft.email.trim().toLowerCase(), '/attributes/@usr02': createDraft.name.trim(), '/attributes/@usr03': createDraft.status, '/attributes/@usr04': createDraft.role, '/attributes/@usr05': createDraft.presentation.trim() });
      setCreateDraft({ email: '', name: '', presentation: '', status: 'in-attesa', role: 'ospite' }); setShowCreate(false); toast.success('Nuova iscrizione inserita.'); await onRefresh();
    } catch { toast.error('La nuova iscrizione non è stata inserita.'); } finally { setBusyId(null); }
  };
  const pendingRows = rows.filter((row) => selectValue(field(row, '@usr03')) === 'in-attesa');
  const updateStatus = async (row: NodeRow, status: string) => {
    if (!canManageRow(row)) return;
    setBusyId(row.id);
    try { const values: Record<string, unknown> = { '/attributes/@usr03': status }; if (status === 'approvato' && !String(field(row, '@usr04') ?? '').trim()) values['/attributes/@usr04'] = 'ospite'; await updateNode(PROJECTS.utenti, row.id, values); toast.success(status === 'approvato' ? 'Iscrizione approvata.' : 'Iscrizione declinata.'); await onRefresh(); }
    catch { toast.error('Lo stato dell’iscrizione non è stato aggiornato.'); } finally { setBusyId(null); }
  };
  return <CardShell>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Gestione account</p><h2 className="mt-1 text-xl font-semibold">Console utenti iscritti</h2><p className="mt-2 text-sm text-muted-foreground">Solo l’Admin può approvare le iscrizioni, assegnare ruoli e gestire gli account.</p></div><button type="button" onClick={() => { setShowCreate((value) => !value); setEditingId(null); }} className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus size={16} />Nuova iscrizione</button></div>
    {showCreate && <form onSubmit={createUser} className="mt-5 grid gap-3 rounded-2xl border border-primary/35 bg-primary/5 p-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold"><span>Nome</span><input required value={createDraft.name} onChange={(event) => setCreateDraft((value) => ({ ...value, name: event.target.value }))} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label><label className="space-y-2 text-sm font-semibold"><span>Email</span><input required type="email" value={createDraft.email} onChange={(event) => setCreateDraft((value) => ({ ...value, email: event.target.value }))} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label><label className="space-y-2 text-sm font-semibold sm:col-span-2"><span>Presentazione</span><textarea required minLength={10} value={createDraft.presentation} onChange={(event) => setCreateDraft((value) => ({ ...value, presentation: event.target.value }))} className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 font-normal" /></label><SelectField label="Stato" value={createDraft.status} options={accessOptions} onChange={(status) => setCreateDraft((value) => ({ ...value, status }))} /><SelectField label="Ruolo" value={createDraft.role} options={availableRoles} onChange={(role) => setCreateDraft((value) => ({ ...value, role }))} /><div className="flex gap-2 sm:col-span-2"><button disabled={busyId === 'new'} className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Save size={16} />Salva iscrizione</button><button type="button" onClick={() => setShowCreate(false)} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold">Annulla</button></div></form>}
    <div className="mt-6 space-y-3">{rows.map((row) => { const protectedRow = targetIsProtected(row); const editable = canManageRow(row); const pending = selectValue(field(row, '@usr03')) === 'in-attesa'; return <div key={row.id} className={`rounded-2xl border p-4 ${protectedRow ? 'border-amber-400/40 bg-amber-400/5' : 'border-border/70 bg-background/45'}`}>{editingId === row.id ? <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold"><span>Nome</span><input value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label><label className="space-y-2 text-sm font-semibold"><span>Email</span><input type="email" value={draft.email} onChange={(event) => setDraft((value) => ({ ...value, email: event.target.value }))} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label><label className="space-y-2 text-sm font-semibold sm:col-span-2"><span>Presentazione</span><textarea value={draft.presentation} onChange={(event) => setDraft((value) => ({ ...value, presentation: event.target.value }))} className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 font-normal" /></label><SelectField label="Stato" value={draft.status} options={accessOptions} onChange={(status) => setDraft((value) => ({ ...value, status }))} /><SelectField label="Ruolo" value={draft.role} options={availableRoles} onChange={(role) => setDraft((value) => ({ ...value, role }))} /><div className="flex gap-2 sm:col-span-2"><button type="button" disabled={busyId === row.id} onClick={() => void saveUser(row)} className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Save size={16} />Salva</button><button type="button" onClick={() => setEditingId(null)} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold"><X size={16} /></button></div></div> : <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="rounded-xl bg-primary/15 p-3 text-primary"><UserRound size={18} /></span><div className="min-w-0"><p className="truncate font-semibold">{String(field(row, '@usr02') ?? title(row))}</p><p className="truncate text-sm text-muted-foreground">{String(field(row, '@usr01') ?? '')}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{String(field(row, '@usr05') ?? '') || 'Presentazione non disponibile'}</p></div></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold">{selectValue(field(row, '@usr03')) || 'in-attesa'}</span><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{roleOptions.find((option) => option.value === selectValue(field(row, '@usr04')))?.label ?? 'OSPITE'}</span>{protectedRow && <ShieldAlert size={17} className="text-amber-500" aria-label="Account protetto" />}{pending && editable && <><button type="button" onClick={() => void updateStatus(row, 'approvato')} className="min-h-11 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Approva</button><button type="button" onClick={() => void updateStatus(row, 'rifiutato')} className="min-h-11 rounded-xl border border-destructive/50 px-3 py-2 text-xs font-semibold text-destructive">Declina</button></>}{editable && <><button type="button" onClick={() => beginEdit(row)} className="min-h-11 rounded-xl border border-border px-3 py-2 text-xs font-semibold"><Pencil size={14} /></button><button type="button" disabled={busyId === row.id} onClick={() => void deleteUser(row)} className="min-h-11 rounded-xl border border-destructive/50 px-3 py-2 text-xs font-semibold text-destructive"><Trash2 size={14} /></button></>}</div></div>}</div>; })}{rows.length === 0 && <p className="rounded-xl bg-accent/60 p-4 text-sm text-muted-foreground">Nessuna iscrizione registrata.</p>}</div>{pendingRows.length === 0 && <p className="mt-4 text-xs text-muted-foreground">Nessuna iscrizione in attesa.</p>}
  </CardShell>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <label className="space-y-2 text-sm font-semibold"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function CardShell({ children }: { children: React.ReactNode }) { return <section className="neon-panel rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur">{children}</section>; }
