import * as React from 'react';
import { CheckCircle2, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { createNode, field, numeric, selectValue, title, type NodeRow, PROJECTS } from '../services/magazzinoApi';
import { dateInputToRomeIso } from '../lib/rome-time';

type EpalAccountingPanelProps = {
  rows: NodeRow[];
  editable: boolean;
  onRefresh: () => Promise<void>;
};

type EpalForm = {
  dataMovimento: string;
  cliente: string;
  ddt: string;
  dataDdt: string;
  fattura: string;
  quantita: string;
  notaCredito: string;
  dataNotaCredito: string;
  movimento: string;
};

const movementOptions = [
  { value: 'rientro-fisico', label: 'Rientro fisico', tone: 'text-emerald-500' },
  { value: 'nota-credito', label: 'Nota credito', tone: 'text-rose-500' },
  { value: 'saldo-iniziale', label: 'Saldo iniziale', tone: 'text-amber-500' },
];

const emptyForm = (): EpalForm => ({
  dataMovimento: '',
  cliente: '',
  ddt: '',
  dataDdt: '',
  fattura: '',
  quantita: '',
  notaCredito: '',
  dataNotaCredito: '',
  movimento: 'rientro-fisico',
});

function dateValue(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeZone: 'Europe/Rome' }).format(parsed);
}

function dateToIso(value: string) {
  return dateInputToRomeIso(value);
}

function movementValue(row: NodeRow) {
  const value = selectValue(field(row, '@epa03'));
  if (value === 'spedita') return 'nota-credito';
  if (value === 'rientrata') return 'rientro-fisico';
  return value;
}

function movementLabel(value: string) {
  return movementOptions.find((option) => option.value === value)?.label ?? (value || 'Non indicato');
}

export type EpalSummary = {
  opening: number;
  creditNotes: number;
  physicalReturns: number;
  current: number;
};

export function getEpalSummary(rows: NodeRow[]): EpalSummary {
  const opening = rows.filter((row) => movementValue(row) === 'saldo-iniziale').reduce((sum, row) => sum + numeric(field(row, '@epa04')), 0);
  const creditNotes = rows.filter((row) => movementValue(row) === 'nota-credito').reduce((sum, row) => sum + numeric(field(row, '@epa04')), 0);
  const physicalReturns = rows.filter((row) => movementValue(row) === 'rientro-fisico').reduce((sum, row) => sum + numeric(field(row, '@epa04')), 0);
  return { opening, creditNotes, physicalReturns, current: opening + creditNotes - physicalReturns };
}

export function EpalBalanceCard({ summary, compact = false }: { summary: EpalSummary; compact?: boolean }) {
  const balanceTone = summary.current > 0 ? 'border-lime-400/80 bg-lime-300/20 text-lime-600 dark:text-lime-300' : summary.current < 0 ? 'border-red-400/80 bg-red-300/20 text-red-600 dark:text-red-300' : 'border-border bg-muted/40 text-muted-foreground';
  const balanceLabel = summary.current > 0 ? 'A NOSTRO CREDITO' : summary.current < 0 ? 'A NOSTRO DEBITO' : 'SALDO ZERO';
  return <div className={`rounded-xl border-2 ${compact ? 'p-3 sm:min-w-[15rem]' : 'p-4'} ${balanceTone}`}><p className={`${compact ? 'text-3xl' : 'text-5xl'} font-black uppercase leading-none tracking-[0.16em] text-cyan-500 dark:text-cyan-300`}>EPAL</p><p className="mt-2 text-xs font-bold uppercase tracking-wide opacity-80">Giacenza attuale</p><p className={`${compact ? 'mt-1 text-2xl' : 'mt-2 text-3xl'} font-black tabular-nums`}>{Math.abs(summary.current).toLocaleString('it-IT')}</p><p className="mt-1 text-xs font-bold tracking-wide">{balanceLabel}</p></div>;
}

function normalized(value: unknown) {
  return String(value ?? '').toLocaleLowerCase('it-IT').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function EpalAccountingPanel({ rows, editable, onRefresh }: EpalAccountingPanelProps) {
  const [query, setQuery] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState<EpalForm>(() => emptyForm());
  const [saving, setSaving] = React.useState(false);

  const summary = React.useMemo(() => getEpalSummary(rows), [rows]);

  const visibleRows = React.useMemo(() => {
    const needle = normalized(query.trim());
    return rows.filter((row) => {
      if (!needle) return true;
      const searchable = [
        title(row),
        field(row, '@epa01'),
        field(row, '@epa02'),
        field(row, '@epa03'),
        movementLabel(movementValue(row)),
        field(row, '@epa04'),
        field(row, '@epa05'),
        field(row, '@epa06'),
        field(row, '@epa07'),
        field(row, '@epa08'),
        field(row, '@epa09'),
      ].map(normalized).join(' ');
      return searchable.includes(needle);
    }).slice().sort((left, right) => String(field(right, '@epa01') ?? '').localeCompare(String(field(left, '@epa01') ?? '')));
  }, [query, rows]);

  const updateForm = (key: keyof EpalForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const saveMovement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editable || saving) return;
    const quantity = Number(form.quantita.replace(',', '.'));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Inserisci un numero EPAL maggiore di zero.');
      return;
    }
    setSaving(true);
    const label = movementLabel(form.movimento);
    const payload: Record<string, unknown> = {
      '/text': `${label} - ${form.cliente || 'TRANS ISOLE'} - ${quantity} EPAL`,
      '/attributes/@epa01': dateToIso(form.dataMovimento),
      '/attributes/@epa02': form.cliente,
      '/attributes/@epa03': { type: 'Select', optionId: form.movimento },
      '/attributes/@epa04': quantity,
      '/attributes/@epa05': form.ddt,
      '/attributes/@epa06': dateToIso(form.dataDdt),
      '/attributes/@epa07': form.fattura,
      '/attributes/@epa08': form.notaCredito,
      '/attributes/@epa09': dateToIso(form.dataNotaCredito),
    };
    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (value === undefined || value === '') delete payload[key];
    });
    try {
      await createNode(PROJECTS.epal, payload);
      toast.success('Movimento EPAL registrato.');
      setForm(emptyForm());
      setShowForm(false);
      await onRefresh();
    } catch {
      toast.error('Il movimento EPAL non è stato registrato. Controlla i dati.');
    } finally {
      setSaving(false);
    }
  };

  return <section className="neon-panel rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Database gestione pedane</p>
        <h2 className="mt-1 text-2xl font-semibold">CONTABILITÀ EPAL TRANS ISOLE / GALTIERI</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">Le note di credito aumentano il saldo a debito TRANS ISOLE. I rientri fisici lo riducono. Il saldo attuale viene ricalcolato automaticamente dopo ogni inserimento.</p>
      </div>
      {editable && <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus size={17} />Inserisci movimento</button>}
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-amber-400/70 bg-amber-300/15 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Saldo iniziale a debito TRANS ISOLE</p><p className="mt-2 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-300">{summary.opening.toLocaleString('it-IT')}</p></div>
      <div className="rounded-xl border border-rose-400/70 bg-rose-300/15 p-4"><p className="text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">Totale da note credito</p><p className="mt-2 text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-300">{summary.creditNotes.toLocaleString('it-IT')}</p></div>
      <div className="rounded-xl border border-emerald-400/70 bg-emerald-300/15 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Totale rientrate fisicamente</p><p className="mt-2 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-300">{summary.physicalReturns.toLocaleString('it-IT')}</p></div>
      <EpalBalanceCard summary={summary} />
    </div>

    {showForm && editable && <form onSubmit={saveMovement} className="mt-5 rounded-2xl border border-primary/35 bg-background/60 p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Inserimento manuale</p><h3 className="mt-1 text-xl font-semibold">Nuovo movimento EPAL</h3></div><button type="button" onClick={() => setShowForm(false)} aria-label="Chiudi inserimento movimento" className="min-h-11 min-w-11 rounded-xl border border-border"><X size={18} className="mx-auto" /></button></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-2 text-sm font-semibold"><span>Data movimento</span><input required type="date" value={form.dataMovimento} onChange={(event) => updateForm('dataMovimento', event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold"><span>Cliente</span><input value={form.cliente} onChange={(event) => updateForm('cliente', event.target.value)} placeholder="Es. TRANS ISOLE" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold"><span>Tipo movimento</span><select required value={form.movimento} onChange={(event) => updateForm('movimento', event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal">{movementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="space-y-2 text-sm font-semibold"><span>N. DDT</span><input value={form.ddt} onChange={(event) => updateForm('ddt', event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold"><span>Data DDT</span><input type="date" value={form.dataDdt} onChange={(event) => updateForm('dataDdt', event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold"><span>Fattura riferimento</span><input value={form.fattura} onChange={(event) => updateForm('fattura', event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold"><span>N. EPAL</span><input required min="0.01" step="1" type="number" value={form.quantita} onChange={(event) => updateForm('quantita', event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold"><span>Nota credito</span><input value={form.notaCredito} onChange={(event) => updateForm('notaCredito', event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold"><span>Data nota credito</span><input type="date" value={form.dataNotaCredito} onChange={(event) => updateForm('dataNotaCredito', event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>
      </div>
      <div className="mt-4 flex justify-end"><button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? 'Salvataggio...' : 'Salva movimento'}</button></div>
    </form>}

    <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Registro movimenti</p><p className="mt-1 text-sm text-muted-foreground">Cerca contemporaneamente in data, cliente, DDT, fattura, nota credito, tipo e quantità.</p></div><label className="relative block w-full sm:w-80"><span className="sr-only">Cerca in tutti i campi EPAL</span><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca in tutti i campi" className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm" /></label></div>

    <div className="mt-4 overflow-hidden"><table className="mobile-stack-table w-full table-fixed break-words text-left text-xs leading-4"><thead><tr className="border-b-2 border-primary/35 text-[10px] uppercase tracking-wide text-muted-foreground"><th className="px-1 py-1.5">Data<br />movimento</th><th className="px-1 py-1.5">Cliente</th><th className="px-1 py-1.5">N. DDT</th><th className="px-1 py-1.5">Data<br />DDT</th><th className="px-1 py-1.5">Fattura<br />riferimento</th><th className="px-1 py-1.5">N. EPAL</th><th className="px-1 py-1.5">Nota<br />credito</th><th className="px-1 py-1.5">Data nota<br />credito</th><th className="px-1 py-1.5">Tipo<br />movimento</th></tr></thead><tbody>{visibleRows.map((row) => { const kind = movementValue(row); const isCredit = kind === 'nota-credito'; const isReturn = kind === 'rientro-fisico'; const rowTone = isCredit ? 'bg-rose-300/15' : isReturn ? 'bg-emerald-300/15' : 'bg-amber-300/10'; return <tr key={row.id} className={`border-b border-border/60 ${rowTone}`}><td data-label="DATA MOVIMENTO" className="px-1.5 py-2 align-top break-words tabular-nums">{dateValue(field(row, '@epa01')) || 'N/D'}</td><td data-label="CLIENTE" className="px-1.5 py-2 align-top break-words font-semibold">{String(field(row, '@epa02') ?? '') || 'N/D'}</td><td data-label="N. DDT" className="px-1.5 py-2 align-top break-words">{String(field(row, '@epa05') ?? '') || 'N/D'}</td><td data-label="DATA DDT" className="px-1.5 py-2 align-top break-words tabular-nums">{dateValue(field(row, '@epa06')) || 'N/D'}</td><td data-label="FATTURA RIFERIMENTO" className="px-1.5 py-2 align-top break-words">{String(field(row, '@epa07') ?? '') || 'N/D'}</td><td data-label="N. EPAL" className="px-1.5 py-2 align-top break-words font-bold tabular-nums">{numeric(field(row, '@epa04')).toLocaleString('it-IT')}</td><td data-label="NOTA CREDITO" className="px-1.5 py-2 align-top break-words">{String(field(row, '@epa08') ?? '') || 'N/D'}</td><td data-label="DATA NOTA CREDITO" className="px-1.5 py-2 align-top break-words tabular-nums">{dateValue(field(row, '@epa09')) || 'N/D'}</td><td data-label="TIPO MOVIMENTO" className={`px-1.5 py-2 align-top break-words font-bold ${isCredit ? 'text-rose-500' : isReturn ? 'text-emerald-500' : 'text-amber-500'}`}>{movementLabel(kind)}</td></tr>; })}</tbody></table>{visibleRows.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nessun movimento corrisponde alla ricerca.</div>}</div>
    <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-background/50 p-3 text-xs text-muted-foreground"><CheckCircle2 size={16} className="text-primary" />{visibleRows.length} movimenti visualizzati su {rows.length}. Il saldo è: saldo iniziale + note credito - rientri fisici.</div>
  </section>;
}
