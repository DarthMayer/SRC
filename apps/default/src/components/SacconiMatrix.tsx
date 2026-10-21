import * as React from 'react';
import { toast } from 'sonner';
import { deleteNode, field, formatMetricTons, numeric, PROJECTS, selectValue, type NodeRow, updateNode } from '../services/magazzinoApi';

type SackKind = 'sacconi' | 'sacchi';
type Props = { rows: NodeRow[]; mangimiRows: NodeRow[]; kind: SackKind; selectedCode?: string; editable: boolean; onRefresh: () => Promise<void>; onAddDischarge?: (reference: string) => void };

const map = {
  sacconi: { project: PROJECTS.sacconi, code: '@sac01', lot: '@sac03', date: '@sac04', ddt: '@sac05', qty: '@sac06', plate: '@sac07', count: '@sac08', note: '@sac09', movement: '@sac10', available: '@sac11', client: '@sac12' },
  sacchi: { project: PROJECTS.sacchi, code: '@stk01', lot: '@stk03', date: '@stk04', ddt: '@stk05', qty: '@stk06', plate: '@stk07', count: '@stk08', epal: '@stk09', note: '@stk10', movement: '@stk11', available: '@stk12', client: '@stk13' },
} as const;

function dateLabel(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Europe/Rome' }).format(date);
}

export function SacconiMatrix({ rows, mangimiRows, kind, selectedCode, editable, onRefresh, onAddDischarge }: Props) {
  const config = map[kind];
  const [saving, setSaving] = React.useState<string | null>(null);
  const selectedDenomination = String(field(mangimiRows.find((row) => String(field(row, '@cod01') ?? '').trim().toUpperCase() === String(selectedCode ?? '').trim().toUpperCase()), '@den01') ?? '').trim();
  const scoped = React.useMemo(() => rows.filter((row) => !selectedCode || String(field(row, config.code) ?? '').trim().toUpperCase() === selectedCode.toUpperCase()), [rows, selectedCode, config.code]);
  const groups = React.useMemo(() => {
    const grouped = new Map<string, NodeRow[]>();
    scoped.forEach((row) => {
      const key = String(field(row, config.count) ?? '').trim() || row.id;
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    });
    return Array.from(grouped.entries()).map(([key, entries]) => {
      const ordered = entries.slice().sort((a, b) => String(field(b, config.date) ?? '').localeCompare(String(field(a, config.date) ?? '')));
      const loads = ordered.filter((row) => selectValue(field(row, config.movement)) !== 'scarico');
      const discharges = ordered.filter((row) => selectValue(field(row, config.movement)) === 'scarico');
      const balance = loads.reduce((sum, row) => sum + numeric(field(row, config.qty)), 0) - discharges.reduce((sum, row) => sum + numeric(field(row, config.qty)), 0);
      const availableBalance = loads.filter((row) => selectValue(field(row, config.available)) === 'si').reduce((sum, row) => sum + numeric(field(row, config.qty)), 0) - discharges.reduce((sum, row) => sum + numeric(field(row, config.qty)), 0);
      return { key, loads, discharges, balance, availableBalance };
    }).filter((group) => group.balance > 0.3 || group.availableBalance > 0.3);
  }, [scoped, config]);

  const removeGroup = async (group: (typeof groups)[number]) => {
    if (!editable || saving) return;
    if (!window.confirm(`Eliminare completamente ${kind === 'sacconi' ? 'il saccone' : 'il sacco'} ${group.key}, con carichi e scarichi?`)) return;
    setSaving(`delete-${group.key}`);
    try {
      for (const row of [...group.loads, ...group.discharges]) await deleteNode(config.project, row.id);
      toast.success('Gruppo eliminato completamente.');
      await onRefresh();
    } catch { toast.error('Non è stato possibile eliminare tutto il gruppo.'); await onRefresh(); }
    finally { setSaving(null); }
  };

  const saveNote = async (row: NodeRow, value: string) => {
    if (!editable || saving) return;
    setSaving(row.id);
    try { await updateNode(config.project, row.id, { [`/attributes/${config.note}`]: value.trim() }); toast.success('Nota aggiornata.'); await onRefresh(); }
    catch { toast.error('La nota non è stata aggiornata.'); }
    finally { setSaving(null); }
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-primary/35 bg-background/40 p-4"><div><h3 className="text-xl font-semibold">{selectedCode || 'Giacenza attiva'}</h3>{selectedCode && <p className="mt-1 text-sm font-medium text-primary">{selectedDenomination || 'Nome mangime non indicato'}</p>}<p className="mt-1 text-sm text-muted-foreground">Sono visibili solo i gruppi con merce ancora in giacenza.</p></div><span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">{groups.length} gruppi attivi</span></div>
    {groups.length === 0 && <div className="rounded-2xl border border-dashed border-primary/35 px-4 py-10 text-center text-muted-foreground">Nessuna merce in giacenza per questo codice.</div>}
    {groups.map((group) => { const representative = group.loads[0] ?? group.discharges[0]; const code = String(field(representative, config.code) ?? selectedCode ?? ''); const denomination = String(field(mangimiRows.find((item) => String(field(item, '@cod01') ?? '').trim().toUpperCase() === code.trim().toUpperCase()), '@den01') ?? '').trim() || String(field(representative, kind === 'sacconi' ? '@sac02' : '@stk02') ?? '').trim(); const client = String(field(group.discharges[0], config.client) ?? '').trim(); const headers = ['DDT', 'DATA', 'TM', 'CLIENTE', 'LOTTO', kind === 'sacconi' ? 'TARGA / N. SACCONI' : 'TARGA / N. SACCHI']; return <section key={group.key} className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-background/45 shadow-[0_0_25px_hsl(var(--primary)/0.1)]"><div className="flex flex-wrap items-center justify-between gap-3 bg-primary/10 px-4 py-4"><div><h4 className="text-lg font-semibold">CODICE: {code}{denomination ? ` · ${denomination}` : ''} - {kind === 'sacconi' ? 'N. SACCONI' : 'N. SACCHI'}: {group.key}</h4>{client && <p className="mt-1 text-sm text-orange-500">Cliente scarico: {client}</p>}</div><div className="flex flex-wrap items-center gap-2"><div className="rounded-xl bg-accent px-3 py-2 text-right"><p className="text-[11px] font-bold uppercase tracking-wide">Giacenza</p><p className="text-lg font-extrabold tabular-nums">{formatMetricTons(group.balance)} TM</p></div>{editable && onAddDischarge && group.availableBalance > 0.3 && <button type="button" onClick={() => onAddDischarge(group.key)} className="min-h-11 rounded-xl border border-orange-400/70 bg-background/80 px-3 py-2 text-xs font-bold uppercase text-orange-500">+ Scarico manuale</button>} {editable && <button type="button" onClick={() => { void removeGroup(group); }} className="min-h-11 rounded-xl border border-rose-500/70 bg-rose-500/10 px-3 py-2 text-xs font-bold uppercase text-rose-600">{saving === `delete-${group.key}` ? 'Eliminazione...' : 'Elimina tutto'}</button>}</div></div><div className="w-full overflow-hidden"><table className="matrix-table mobile-stack-table w-full table-fixed break-words text-left text-sm uppercase"><thead><tr className="border-b-2 border-primary/35 text-sm tracking-wide text-muted-foreground">{headers.map((header) => <th key={header} className="px-2 py-2">{header}</th>)}<th className="px-2 py-2">NOTE</th></tr></thead><tbody>{[...group.loads, ...group.discharges].map((row) => { const isLoad = selectValue(field(row, config.movement)) !== 'scarico'; const note = String(field(row, config.note) ?? ''); return <tr key={row.id} className={`border-b border-border/60 ${isLoad ? 'matrix-available' : 'matrix-discharge'}`}><td data-label="DDT" className="px-2 py-2">{String(field(row, config.ddt) ?? '')}</td><td data-label="DATA" className="px-2 py-2">{dateLabel(field(row, config.date))}</td><td data-label="TM" className="px-2 py-2 font-bold tabular-nums">{formatMetricTons(field(row, config.qty))}</td><td data-label="CLIENTE" className="px-2 py-2">{isLoad ? 'DEPOSITO' : String(field(row, config.client) ?? '')}</td><td data-label="LOTTO" className="px-2 py-2">{String(field(row, config.lot) ?? '')}</td><td data-label={headers[5]} className="px-2 py-2"><div>{String(field(row, config.plate) ?? '')}</div><div className="font-semibold">{String(field(row, config.count) ?? '')}</div>{kind === 'sacchi' && <div className="text-xs">EPAL {numeric(field(row, '@stk09')).toLocaleString('it-IT')}</div>}</td><td data-label="NOTE" className="px-2 py-2"><textarea defaultValue={note} disabled={!editable || saving === row.id} onBlur={(event) => { void saveNote(row, event.target.value); }} rows={2} className="w-full min-w-0 rounded-lg border border-input bg-background/50 px-2 py-1 text-sm normal-case" /></td></tr>; })}</tbody></table></div></section>; })}
  </div>;
}

export const SacchiMatrix = SacconiMatrix;
