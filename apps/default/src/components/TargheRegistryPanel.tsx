import * as React from 'react';
import { Search, Truck } from 'lucide-react';
import { field, numeric, type NodeRow } from '../services/magazzinoApi';

function formatDate(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' }).format(date);
}

function isFleetRow(row: NodeRow) {
  return Boolean(
    String(field(row, '@bil11') ?? '').trim()
      || String(field(row, '@bil07') ?? '').trim()
      || String(field(row, '@bil09') ?? '').trim()
      || String(field(row, '@bil10') ?? '').trim(),
  );
}

function rowText(row: NodeRow) {
  return [
    field(row, '@bil01'),
    field(row, '@bil07'),
    field(row, '@bil08'),
    field(row, '@bil09'),
    field(row, '@bil10'),
    field(row, '@bil11'),
    field(row, '@bil12'),
    field(row, '@bil13'),
  ].map((value) => String(value ?? '')).join(' ').toLowerCase();
}

export function TargheRegistryPanel({ rows }: { rows: NodeRow[] }) {
  const [query, setQuery] = React.useState('');
  const fleetRows = React.useMemo(() => rows.filter(isFleetRow), [rows]);
  const filteredRows = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return fleetRows;
    return fleetRows.filter((row) => rowText(row).includes(normalizedQuery));
  }, [fleetRows, query]);
  const readyCount = fleetRows.filter((row) => String(field(row, '@bil11') ?? '').trim() !== 'Vuota').length;
  const emptyCount = fleetRows.length - readyCount;

  return <section className="rounded-2xl border-2 border-primary/30 bg-background/45 p-4 shadow-[0_0_25px_hsl(var(--primary)/0.08)]">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-primary/15 p-3 text-primary"><Truck size={22} /></span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Registro operativo</p>
          <h2 className="mt-1 text-xl font-semibold">TARGHE CASSE GALTIERI</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ricerca e selezione delle targhe da assegnare ai carichi delle casse.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-600 dark:text-emerald-300">{readyCount} in servizio</span>
        <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{emptyCount} vuote</span>
      </div>
    </div>
    <label className="relative mt-5 block max-w-xl">
      <span className="sr-only">Cerca targhe e dati collegati</span>
      <Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca targa, prodotto, DDT, posizione o nota" className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </label>
    <div className="mt-5 overflow-x-auto rounded-xl border border-border/70">
      <table className="min-w-[62rem] w-full text-left text-sm">
        <thead><tr className="border-b-2 border-primary/25 bg-primary/5 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Rimorchio</th><th className="px-3 py-3">Prodotto</th><th className="px-3 py-3">Data carico</th><th className="px-3 py-3">Peso TM</th><th className="px-3 py-3">DDT</th><th className="px-3 py-3">Ultima posizione</th><th className="px-3 py-3">Data arrivo/agg.</th><th className="px-3 py-3">Note</th></tr></thead>
        <tbody>{filteredRows.map((row) => {
          const position = String(field(row, '@bil11') ?? '').trim();
          const isEmpty = position === 'Vuota';
          return <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-accent/35">
            <td className="px-3 py-3 font-mono font-bold whitespace-nowrap">{String(field(row, '@bil01') ?? '')}</td>
            <td className="px-3 py-3 font-semibold">{String(field(row, '@bil07') ?? '') || 'N/D'}</td>
            <td className="px-3 py-3 tabular-nums">{formatDate(field(row, '@bil08')) || 'N/D'}</td>
            <td className="px-3 py-3 font-semibold tabular-nums">{numeric(field(row, '@bil09')) ? numeric(field(row, '@bil09')).toLocaleString('it-IT', { maximumFractionDigits: 2 }) : 'N/D'}</td>
            <td className="px-3 py-3 tabular-nums">{String(field(row, '@bil10') ?? '') || 'N/D'}</td>
            <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isEmpty ? 'bg-slate-500/15 text-slate-600 dark:text-slate-300' : position.includes('Modugno') ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300' : 'bg-emerald-400/20 text-emerald-700 dark:text-emerald-300'}`}>{position || 'N/D'}</span></td>
            <td className="px-3 py-3 tabular-nums">{formatDate(field(row, '@bil12')) || 'N/D'}</td>
            <td className="px-3 py-3 text-muted-foreground">{String(field(row, '@bil13') ?? '') || 'N/D'}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {filteredRows.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-primary/30 bg-background/40 p-5 text-center text-sm text-muted-foreground">Nessuna targa corrisponde alla ricerca.</p>}
  </section>;
}
