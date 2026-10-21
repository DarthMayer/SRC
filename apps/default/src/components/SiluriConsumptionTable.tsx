import * as React from 'react';
import { Gauge, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { field, numeric, PROJECTS, type NodeRow, updateNode } from '../services/magazzinoApi';

type SiluriConsumptionTableProps = { rows: NodeRow[]; editable: boolean; onRefresh: () => Promise<void> };

export function SiluriConsumptionTable({ rows, editable, onRefresh }: SiluriConsumptionTableProps) {
  const orderedRows = React.useMemo(() => rows.slice().sort((left, right) => String(field(left, '@csm01') ?? '').localeCompare(String(field(right, '@csm01') ?? ''))), [rows]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const save = async (row: NodeRow) => {
    const value = Number(draft.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) { toast.error('Inserisci un consumo valido.'); return; }
    try { await updateNode(PROJECTS.consumiSiluri, row.id, { '/attributes/@csm02': value }); setEditingId(null); await onRefresh(); toast.success('Configurazione consumo aggiornata.'); } catch { toast.error('Il consumo non è stato aggiornato.'); }
  };
  return <section className="rounded-2xl border border-cyan-400/25 bg-background/45 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">Configurazione consumi</p><h3 className="mt-1 text-xl font-semibold">CONSUMO MEDIO GIORNALIERO SILURI</h3><p className="mt-2 text-sm text-muted-foreground">Valori usati per calcolare autonomia e previsione del prossimo carico.</p></div><Gauge className="text-cyan-400" size={26} /></div>
    {orderedRows.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-cyan-400/35 p-4 text-sm text-muted-foreground">Nessun consumo configurato.</p> : <div className="mt-4 overflow-x-auto"><table className="mobile-stack-table w-full text-left text-sm"><thead><tr className="border-b border-cyan-400/25 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Codice siluro</th><th className="px-3 py-3">Consumo medio giornaliero</th><th className="px-3 py-3">Azione</th></tr></thead><tbody>{orderedRows.map((row) => { const isEditing = editingId === row.id; return <tr key={row.id} className="border-b border-border/60 last:border-0"><td data-label="CODICE SILURO" className="px-3 py-3 font-mono font-bold text-cyan-500">{String(field(row, '@csm01') ?? '')}</td><td data-label="CONSUMO MEDIO GIORNALIERO" className="px-3 py-3 font-semibold tabular-nums">{isEditing ? <input autoFocus type="number" min="0.01" step="0.01" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void save(row); }} className="h-10 w-32 rounded-lg border border-input bg-background px-2" /> : `${numeric(field(row, '@csm02')).toLocaleString('it-IT')} TM`}</td><td className="px-3 py-3">{editable && (isEditing ? <div className="flex gap-2"><button type="button" onClick={() => { void save(row); }} className="min-h-10 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">Salva</button><button type="button" onClick={() => setEditingId(null)} className="min-h-10 rounded-lg border px-3 text-xs font-semibold">Annulla</button></div> : <button type="button" onClick={() => { setEditingId(row.id); setDraft(String(numeric(field(row, '@csm02')))); }} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-cyan-400/60 px-3 text-xs font-semibold text-cyan-600"><Pencil size={14} />Modifica</button>)}</td></tr>; })}</tbody></table></div>}
  </section>;
}
