import * as React from 'react';
import { Search, Truck } from 'lucide-react';

export type PlateRecord = {
  id: string;
  plate: string;
  product: string;
  date: string;
  lot: string;
  ddt: string;
  position: string;
  note: string;
  cargoType: string;
};

type BaseProps = {
  title: string;
  description: string;
  records: PlateRecord[];
  accentClass?: string;
};

type SearchProps = BaseProps & {
  showCargoTypeFilter?: boolean;
};

const positionClass: Record<string, string> = {
  VUOTA: 'border-rose-400/60 bg-rose-300/20 text-rose-700 dark:text-rose-200',
  'IN TRANSITO': 'border-amber-400/60 bg-amber-300/20 text-amber-800 dark:text-amber-200',
  'DEPOSITO CAGLIARI': 'border-emerald-400/60 bg-emerald-300/20 text-emerald-800 dark:text-emerald-200',
};

function formatDate(value: string) {
  if (!value) return 'N/D';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' }).format(date);
}

function normalizePosition(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized.includes('VUOT')) return 'VUOTA';
  if (normalized.includes('DEPOSIT')) return 'DEPOSITO CAGLIARI';
  return normalized || 'IN TRANSITO';
}

function PlateTable({ records }: { records: PlateRecord[] }) {
  return <div className="overflow-x-auto rounded-xl border border-border/70"><table className="min-w-[64rem] w-full text-left text-sm"><thead><tr className="border-b-2 border-primary/25 bg-primary/5 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Targa</th><th className="px-3 py-3">Tipologia carico</th><th className="px-3 py-3">Prodotto</th><th className="px-3 py-3">Data carico</th><th className="px-3 py-3">Lotto</th><th className="px-3 py-3">DDT</th><th className="px-3 py-3">Ultima posizione</th><th className="px-3 py-3">Note</th></tr></thead><tbody>{records.map((record) => { const position = normalizePosition(record.position); return <tr key={record.id} className="border-b border-border/60 last:border-0"><td className={`px-3 py-3 font-mono font-bold ${positionClass[position] ? positionClass[position].split(' ').filter((item) => item.startsWith('text-')).join(' ') : ''}`}>{record.plate || 'N/D'}</td><td className="px-3 py-3"><span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{record.cargoType || 'N/D'}</span></td><td className="px-3 py-3 font-semibold">{record.product || 'N/D'}</td><td className="px-3 py-3 tabular-nums">{formatDate(record.date)}</td><td className="px-3 py-3">{record.lot || 'N/D'}</td><td className="px-3 py-3">{record.ddt || 'N/D'}</td><td className="px-3 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${positionClass[position] ?? 'border-border bg-muted text-muted-foreground'}`}>{position}</span></td><td className="px-3 py-3 text-muted-foreground">{record.note || 'N/D'}</td></tr>; })}</tbody></table></div>;
}

export function TargheSearchPanel({ title, description, records, accentClass = 'text-primary', showCargoTypeFilter = false }: SearchProps) {
  const [query, setQuery] = React.useState('');
  const [cargoType, setCargoType] = React.useState('TUTTE');
  const normalizedQuery = query.trim().toLowerCase();
  const cargoTypes = Array.from(new Set(records.map((record) => record.cargoType).filter(Boolean)));
  const filteredRecords = records.filter((record) => cargoType === 'TUTTE' || record.cargoType === cargoType);
  const result = normalizedQuery ? filteredRecords.filter((record) => record.plate.toLowerCase().includes(normalizedQuery)) : [];

  return <section className="rounded-2xl border-2 border-primary/25 bg-background/45 p-4 shadow-[0_0_25px_hsl(var(--primary)/0.08)]"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="rounded-xl bg-primary/15 p-3 text-primary"><Truck size={22} /></span><div><p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accentClass}`}>Ricerca targhe</p><h2 className="mt-1 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p></div></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{records.length} carichi registrati</span></div><div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(13rem,0.35fr)]"><label className="relative block"><span className="sr-only">Cerca esclusivamente la targa richiesta</span><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} placeholder="Inserisci la targa da cercare" className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm uppercase outline-none focus:ring-2 focus:ring-ring" /></label>{showCargoTypeFilter && <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><span>Tipologia di carico</span><select value={cargoType} onChange={(event) => setCargoType(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal normal-case text-foreground outline-none focus:ring-2 focus:ring-ring"><option value="TUTTE">Tutte le tipologie</option>{cargoTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>}</div>{!normalizedQuery && <p className="mt-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">Inserisci una targa e seleziona la tipologia di carico per visualizzare solo il risultato richiesto.</p>}{normalizedQuery && result.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-primary/30 bg-background/40 p-5 text-center text-sm text-muted-foreground">Nessuna targa trovata per la tipologia selezionata.</p>}{result.length > 0 && <div className="mt-5"><PlateTable records={result} /></div>}</section>;
}

export function TargheListPanel({ title, description, records, accentClass = 'text-primary' }: BaseProps) {
  return <section className="rounded-2xl border-2 border-primary/25 bg-background/45 p-4 shadow-[0_0_25px_hsl(var(--primary)/0.08)]"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="rounded-xl bg-primary/15 p-3 text-primary"><Truck size={22} /></span><div><p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accentClass}`}>Elenco carichi</p><h2 className="mt-1 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p></div></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{records.length} carichi</span></div>{records.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-primary/30 bg-background/40 p-6 text-center text-sm text-muted-foreground">Nessun carico registrato per questa tipologia.</p> : <div className="mt-5"><PlateTable records={records} /></div>}</section>;
}
