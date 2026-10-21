import * as React from 'react';
import { toast } from 'sonner';
import { createNode, deleteNode, field, title, updateNode, PROJECTS, type NodeRow } from '../services/magazzinoApi';

type CategoryKey = 'casse' | 'siluri' | 'sacconi' | 'sacchi';

type Props = {
  rows: NodeRow[];
  editable: boolean;
  onRefresh: () => Promise<void>;
};

const sections: Array<{ key: CategoryKey; label: string; tone: string }> = [
  { key: 'casse', label: 'CASSE', tone: 'border-amber-400/40 bg-amber-400/10 text-amber-500' },
  { key: 'siluri', label: 'SILURI', tone: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-500' },
  { key: 'sacconi', label: 'SACCONI', tone: 'border-violet-400/40 bg-violet-400/10 text-violet-500' },
  { key: 'sacchi', label: 'SACCHI', tone: 'border-lime-400/40 bg-lime-400/10 text-lime-500' },
];

const categoryLabel: Record<CategoryKey, string> = {
  casse: 'CASSE',
  siluri: 'SILURI',
  sacconi: 'SACCONI',
  sacchi: 'SACCHI',
};

type Draft = { code: string; name: string; category: CategoryKey };

export function MangimiArchivePanel({ rows, editable, onRefresh }: Props) {
  const [drafts, setDrafts] = React.useState<Record<string, Draft>>({});
  const [newEntry, setNewEntry] = React.useState<Draft>({ code: '', name: '', category: 'casse' });
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const draftFor = (row: NodeRow): Draft => drafts[row.id] ?? {
    code: String(field(row, '@cod01') ?? title(row)),
    name: String(field(row, '@den01') ?? ''),
    category: (String(field(row, '@cat01') && typeof field(row, '@cat01') === 'object' && 'optionId' in (field(row, '@cat01') as object) ? (field(row, '@cat01') as { optionId: string }).optionId : field(row, '@cat01') ?? 'casse') as CategoryKey),
  };

  const saveRow = async (row: NodeRow) => {
    if (!editable) return;
    const draft = draftFor(row);
    if (!draft.code.trim() || !draft.name.trim()) {
      toast.error('Inserisci codice e denominazione.');
      return;
    }
    setSavingId(row.id);
    try {
      await updateNode(PROJECTS.mangimi, row.id, {
        '/text': draft.name.trim(),
        '/attributes/@cod01': draft.code.trim().toUpperCase(),
        '/attributes/@den01': draft.name.trim(),
        '/attributes/@cat01': draft.category,
      });
      toast.success('Codice mangime aggiornato.');
      await onRefresh();
    } catch {
      toast.error('Non riesco ad aggiornare il codice mangime.');
    } finally {
      setSavingId(null);
    }
  };

  const removeRow = async (row: NodeRow) => {
    if (!editable) return;
    const code = String(field(row, '@cod01') ?? title(row));
    if (!window.confirm(`Eliminare ${code}?`)) return;
    setSavingId(row.id);
    try {
      await deleteNode(PROJECTS.mangimi, row.id);
      toast.success('Codice mangime eliminato.');
      await onRefresh();
    } catch {
      toast.error('Non riesco a eliminare il codice mangime.');
    } finally {
      setSavingId(null);
    }
  };

  const addRow = async () => {
    if (!editable) return;
    if (!newEntry.code.trim() || !newEntry.name.trim()) {
      toast.error('Inserisci codice e denominazione.');
      return;
    }
    setSavingId('new');
    try {
      await createNode(PROJECTS.mangimi, {
        '/text': newEntry.name.trim(),
        '/attributes/@cod01': newEntry.code.trim().toUpperCase(),
        '/attributes/@den01': newEntry.name.trim(),
        '/attributes/@cat01': newEntry.category,
      });
      toast.success('Codice mangime aggiunto.');
      setNewEntry({ code: '', name: '', category: 'casse' });
      await onRefresh();
    } catch {
      toast.error('Non riesco ad aggiungere il codice mangime.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="neon-panel rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Catalogo prodotti</p>
          <h2 className="mt-1 text-xl font-semibold">ARCHIVIO CODICI MANGIMI</h2>
          <p className="mt-2 text-sm text-muted-foreground">Modifica, elimina o aggiungi codici direttamente nella categoria corretta. 1047SCPAF è associato alle CASSE.</p>
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{rows.length} codici</span>
      </div>
      {editable && <div className="mb-5 grid gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 md:grid-cols-[1fr_1.6fr_1fr_auto]">
        <input aria-label="Nuovo codice mangime" value={newEntry.code} onChange={(event) => setNewEntry((current) => ({ ...current, code: event.target.value }))} placeholder="Nuovo codice" className="h-11 rounded-xl border border-input bg-background px-3" />
        <input aria-label="Nuova denominazione" value={newEntry.name} onChange={(event) => setNewEntry((current) => ({ ...current, name: event.target.value }))} placeholder="Denominazione" className="h-11 rounded-xl border border-input bg-background px-3" />
        <select aria-label="Categoria nuovo codice" value={newEntry.category} onChange={(event) => setNewEntry((current) => ({ ...current, category: event.target.value as CategoryKey }))} className="h-11 rounded-xl border border-input bg-background px-3">{sections.map((section) => <option key={section.key} value={section.key}>{section.label}</option>)}</select>
        <button type="button" disabled={savingId === 'new'} onClick={() => void addRow()} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">Aggiungi</button>
      </div>}
      <div className="grid gap-5 xl:grid-cols-2">
        {sections.map((section) => {
          const items = rows.filter((row) => String(field(row, '@cat01') && typeof field(row, '@cat01') === 'object' && 'optionId' in (field(row, '@cat01') as object) ? (field(row, '@cat01') as { optionId: string }).optionId : field(row, '@cat01') ?? '').toLowerCase().includes(section.key)).sort((left, right) => String(field(left, '@cod01') ?? '').localeCompare(String(field(right, '@cod01') ?? '')));
          const hasItems = items.length > 0;
          return <section key={section.key} className={`overflow-hidden rounded-2xl border ${section.tone}`}><div className="flex items-center justify-between gap-3 border-b border-current/20 px-4 py-3"><h3 className="font-bold tracking-wide">{categoryLabel[section.key]}</h3><span className="rounded-full bg-background/60 px-3 py-1 text-xs font-bold">{items.length}</span></div>{hasItems ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-current/15 text-xs uppercase tracking-wide"><th className="px-3 py-3">Codice</th><th className="px-3 py-3">Denominazione</th>{editable && <th className="px-3 py-3">Azioni</th>}</tr></thead><tbody>{items.map((row) => { const draft = draftFor(row); const busy = savingId === row.id; return <tr key={row.id} className="border-b border-current/10 last:border-0"><td className="px-3 py-2"><input aria-label={`Codice ${title(row)}`} disabled={!editable || busy} value={draft.code} onChange={(event) => setDrafts((current) => ({ ...current, [row.id]: { ...draft, code: event.target.value } }))} className="h-10 w-full min-w-28 rounded-lg border border-input bg-background/60 px-2 font-mono font-bold" /></td><td className="px-3 py-2"><input aria-label={`Denominazione ${title(row)}`} disabled={!editable || busy} value={draft.name} onChange={(event) => setDrafts((current) => ({ ...current, [row.id]: { ...draft, name: event.target.value } }))} className="h-10 w-full min-w-48 rounded-lg border border-input bg-background/60 px-2" />{editable && <select aria-label={`Categoria ${title(row)}`} disabled={busy} value={draft.category} onChange={(event) => setDrafts((current) => ({ ...current, [row.id]: { ...draft, category: event.target.value as CategoryKey } }))} className="mt-2 h-9 w-full rounded-lg border border-input bg-background/60 px-2 text-xs">{sections.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select>}</td>{editable && <td className="px-3 py-2"><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void saveRow(row)} className="min-h-10 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">Salva</button><button type="button" disabled={busy} onClick={() => void removeRow(row)} className="min-h-10 rounded-lg border border-destructive/50 px-3 text-xs font-semibold text-destructive disabled:opacity-50">Elimina</button></div></td>}</tr>; })}</tbody></table></div> : <p className="p-5 text-sm text-muted-foreground">Nessun codice assegnato a questa categoria.</p>}</section>;
        })}
      </div>
    </section>
  );
}
