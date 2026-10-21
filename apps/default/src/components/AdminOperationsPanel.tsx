import * as React from 'react';
import Papa from 'papaparse';
import { Activity, ArrowDownToLine, FileSpreadsheet, FileText, ShieldCheck } from 'lucide-react';
import { field, metricTons, numeric, selectValue, title, type NodeRow, type ProjectKey } from '../services/magazzinoApi';

type AppData = Record<ProjectKey, NodeRow[]>;
type ReportRow = Record<string, string | number>;
type View = 'activity' | 'reports' | 'security';
type Props = {
  view: View;
  data: AppData;
  isAdmin: boolean;
  canExport: boolean;
  staffExportAllowed: boolean;
  onSetStaffExport: (enabled: boolean) => Promise<void>;
  exportSaving: boolean;
};

type MovementSource = {
  key: 'casse' | 'siluri' | 'sacconi' | 'sacchi';
  label: string;
  code: string;
  name: string;
  lot: string;
  date: string;
  ddt: string;
  quantity: string;
  plate: string;
  client: string;
  movement: string;
  count: string;
};

const movementSources: MovementSource[] = [
  { key: 'casse', label: 'CASSE', code: '@cas01', name: '@cas02', lot: '@cas03', date: '@cas04', ddt: '@cas05', quantity: '@cas06', plate: '@cas07', client: '@cas09', movement: '@cas11', count: '@cas08' },
  { key: 'siluri', label: 'SILURI', code: '@sil01', name: '@sil02', lot: '@sil03', date: '@sil04', ddt: '@sil05', quantity: '@sil06', plate: '@sil07', client: '@sil08', movement: '@sil10', count: '@sil08' },
  { key: 'sacconi', label: 'SACCONI', code: '@sac01', name: '@sac02', lot: '@sac03', date: '@sac04', ddt: '@sac05', quantity: '@sac06', plate: '@sac07', client: '@sac12', movement: '@sac10', count: '@sac08' },
  { key: 'sacchi', label: 'SACCHI', code: '@stk01', name: '@stk02', lot: '@stk03', date: '@stk04', ddt: '@stk05', quantity: '@stk06', plate: '@stk07', client: '@stk13', movement: '@stk11', count: '@stk08' },
];

const reportOptions = [
  { id: 'carichi', label: 'Report carichi' },
  { id: 'scarichi', label: 'Report scarichi' },
  { id: 'giacenze', label: 'Report giacenze' },
  { id: 'lotto', label: 'Report per lotto' },
  { id: 'prodotto', label: 'Report per prodotto' },
  { id: 'cliente', label: 'Report per cliente' },
  { id: 'ddt', label: 'Report per DDT' },
  { id: 'trasporti', label: 'Report trasporti' },
  { id: 'epal', label: 'Report EPAL' },
  { id: 'anomalie', label: 'Report anomalie' },
  { id: 'attivita', label: 'Report attività utenti' },
] as const;

type ReportId = (typeof reportOptions)[number]['id'];

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`neon-panel rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur ${className}`}>{children}</section>;
}

function text(value: unknown) {
  if (value && typeof value === 'object' && 'optionId' in value) return String((value as { optionId: string }).optionId);
  return String(value ?? '').trim();
}

function localDate(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeZone: 'Europe/Rome' }).format(date);
}

function dateKey(value: unknown) {
  const raw = String(value ?? '').trim();
  const date = new Date(raw);
  if (!raw || Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Rome' }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function activityRows(rows: NodeRow[]): ReportRow[] {
  return rows.slice().sort((left, right) => String(field(right, '@acc03') ?? '').localeCompare(String(field(left, '@acc03') ?? ''))).map((row) => ({
    'Data e ora': localDate(field(row, '@acc03')),
    Utente: text(field(row, '@acc02')) || text(field(row, '@acc01')) || 'Utente non indicato',
    Operazione: text(field(row, '@acc06')) || selectValue(field(row, '@acc04')) || 'Attività',
    DDT: text(field(row, '@acc07')),
    Prodotto: text(field(row, '@acc08')),
    Lotto: text(field(row, '@acc09')),
    Magazzino: selectValue(field(row, '@acc10')) || 'Altro',
    Dettaglio: text(field(row, '@acc11')) || text(field(row, '@acc05')),
  }));
}

function movementRows(data: AppData): ReportRow[] {
  const catalog = new Map((data.mangimi ?? []).map((row) => [text(field(row, '@cod01')).toUpperCase(), text(field(row, '@den01'))]));
  return movementSources.flatMap((source) => (data[source.key] ?? []).map((row) => {
    const code = text(field(row, source.code)).toUpperCase();
    const movement = selectValue(field(row, source.movement)) === 'scarico' ? 'Scarico' : 'Carico';
    const codeName = catalog.get(code) || text(field(row, source.name));
    const rawClient = text(field(row, source.client));
    const client = rawClient.toLowerCase() === 'agristar' ? 'AGRISTAR' : rawClient.toLowerCase() === 'agristar-foddi' ? 'AGRISTAR/FODDI' : rawClient;
    return {
      Magazzino: source.label,
      Movimento: movement,
      Data: localDate(field(row, source.date)),
      Codice: code,
      Prodotto: codeName,
      Lotto: text(field(row, source.lot)),
      DDT: text(field(row, source.ddt)),
      'Quantità TM': metricTons(field(row, source.quantity)),
      Cliente: client,
      Targa: text(field(row, source.plate)),
      'Cassa / quantità': text(field(row, source.count)),
      Riga: title(row),
    };
  }));
}

function stockRows(data: AppData, _movements: ReportRow[]): ReportRow[] {
  const catalog = new Map((data.mangimi ?? []).map((row) => [text(field(row, '@cod01')).toUpperCase(), { product: text(field(row, '@den01')), category: selectValue(field(row, '@cat01')).toLowerCase() }]));
  const statusesByLoad = new Map((data.statiSiluri ?? []).map((row) => [text(field(row, '@sst05')), selectValue(field(row, '@sst02'))]));
  const stock = new Map<string, { warehouse: string; product: string; balance: number; lastDate: string }>();
  movementSources.forEach((source) => {
    (data[source.key] ?? []).forEach((row) => {
      const code = text(field(row, source.code)).toUpperCase();
      if (!code) return;
      const key = `${source.label}:${code}`;
      const saved = stock.get(key) ?? { warehouse: source.label, product: catalog.get(code)?.product || text(field(row, source.name)), balance: 0, lastDate: '' };
      if (source.key === 'siluri') {
        const status = statusesByLoad.get(row.id) || 'transito';
        if (status !== 'vuota') saved.balance += numeric(field(row, source.quantity));
      } else {
        const isDischarge = selectValue(field(row, source.movement)) === 'scarico';
        saved.balance += numeric(field(row, source.quantity)) * (isDischarge ? -1 : 1);
      }
      const rowDate = String(field(row, source.date) ?? '');
      if (rowDate > saved.lastDate) saved.lastDate = rowDate;
      stock.set(key, saved);
    });
  });
  catalog.forEach((entry, code) => {
    const category = entry.category.includes('casse') ? 'CASSE' : entry.category.includes('silur') ? 'SILURI' : entry.category.includes('sacconi') ? 'SACCONI' : entry.category.includes('sacchi') ? 'SACCHI' : '';
    if (!category) return;
    const key = `${category}:${code}`;
    if (!stock.has(key)) stock.set(key, { warehouse: category, product: entry.product, balance: 0, lastDate: '' });
  });
  return Array.from(stock.entries()).map(([key, value]) => ({ Magazzino: value.warehouse, Codice: key.slice(key.indexOf(':') + 1), Prodotto: value.product, 'Giacenza TM': Math.round((value.balance / 10) * 100) / 100, 'Ultimo movimento': localDate(value.lastDate) }));
}

function buildReport(data: AppData, kind: ReportId): ReportRow[] {
  const movements = movementRows(data);
  const stocks = stockRows(data, movements);
  const activities = activityRows(data.accessi ?? []);
  if (kind === 'carichi') return movements.filter((row) => row.Movimento === 'Carico');
  if (kind === 'scarichi') return movements.filter((row) => row.Movimento === 'Scarico');
  if (kind === 'giacenze') return stocks;
  if (kind === 'lotto') return movements.slice().sort((left, right) => String(left.Lotto).localeCompare(String(right.Lotto)));
  if (kind === 'prodotto') return movements.slice().sort((left, right) => String(left.Prodotto).localeCompare(String(right.Prodotto)));
  if (kind === 'cliente') return movements.filter((row) => Boolean(row.Cliente)).sort((left, right) => String(left.Cliente).localeCompare(String(right.Cliente)));
  if (kind === 'ddt') return movements.filter((row) => Boolean(row.DDT)).sort((left, right) => String(left.DDT).localeCompare(String(right.DDT)));
  if (kind === 'trasporti') return movements.filter((row) => Boolean(row.Targa)).sort((left, right) => String(left.Targa).localeCompare(String(right.Targa)));
  if (kind === 'epal') return (data.epal ?? []).map((row) => ({ Data: localDate(field(row, '@epa01')), DDT: text(field(row, '@epa02')), Movimento: selectValue(field(row, '@epa03')), 'Numero EPAL': numeric(field(row, '@epa04')), Dettaglio: title(row) }));
  if (kind === 'attivita') return activities;
  const anomalies = movements.filter((row) => !row.Codice || !row.Data || numeric(row['Quantità TM']) <= 0);
  const negativeStocks = stocks.filter((row) => numeric(row['Giacenza TM']) < 0);
  const unscheduled = (data.scarichi ?? []).filter((row) => !text(field(row, '@sca02')) || !text(field(row, '@sca01'))).map((row) => ({ Magazzino: 'PROGRAMMA CARICHI', Codice: text(field(row, '@sca02')), Data: localDate(field(row, '@sca01')), DDT: text(field(row, '@sca04')), Anomalia: 'Codice o data mancanti', Riga: title(row) }));
  return [...anomalies.map((row) => ({ ...row, Anomalia: 'Movimento con codice, data o quantità incompleta' })), ...negativeStocks.map((row) => ({ ...row, Anomalia: 'Giacenza negativa' })), ...unscheduled];
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function titleForReport(kind: ReportId) {
  return reportOptions.find((item) => item.id === kind)?.label ?? 'Report';
}

function ActivityRegister({ rows }: { rows: NodeRow[] }) {
  const [filters, setFilters] = React.useState({ user: '', date: '', operation: '', ddt: '', product: '', lot: '', warehouse: '' });
  const filteredRows = React.useMemo(() => rows.filter((row) => {
    const operation = text(field(row, '@acc06')) || selectValue(field(row, '@acc04')) || 'Attività';
    const user = text(field(row, '@acc02')) || text(field(row, '@acc01'));
    const includes = (query: string, value: unknown) => !query || String(value ?? '').toLowerCase().includes(query.toLowerCase());
    return includes(filters.user, user)
      && (!filters.date || dateKey(field(row, '@acc03')) === filters.date)
      && includes(filters.operation, operation)
      && includes(filters.ddt, field(row, '@acc07'))
      && includes(filters.product, field(row, '@acc08'))
      && includes(filters.lot, field(row, '@acc09'))
      && includes(filters.warehouse, selectValue(field(row, '@acc10')));
  }), [rows, filters]);
  const filtered = React.useMemo(() => activityRows(filteredRows), [filteredRows]);
  const hasRows = filtered.length > 0;
  const setFilter = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const filterItems: Array<[keyof typeof filters, string]> = [['user', 'Utente'], ['operation', 'Operazione'], ['ddt', 'DDT'], ['product', 'Prodotto'], ['lot', 'Lotto'], ['warehouse', 'Magazzino']];
  return <div className="space-y-5"><Card><div className="flex items-start gap-3"><span className="rounded-xl bg-primary/15 p-3 text-primary"><Activity size={22} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tracciabilità operativa</p><h2 className="mt-1 text-2xl font-semibold">REGISTRO ATTIVITÀ</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Eventi registrati dall’app, con utente, data, operazione, DDT, prodotto, lotto e magazzino. Il registro non è immodificabile e non include attività svolte fuori dall’app.</p></div></div></Card><Card><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{filterItems.map(([key, label]) => <label key={key} className="space-y-1 text-sm font-semibold"><span>{label}</span><input value={filters[key]} onChange={(event) => setFilter(key, event.target.value)} placeholder={`Filtra ${label.toLowerCase()}`} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>)}<label className="space-y-1 text-sm font-semibold"><span>Data</span><input type="date" value={filters.date} onChange={(event) => setFilter('date', event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label></div><div className="mt-5 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{filtered.length} attività corrispondenti</p><button type="button" onClick={() => setFilters({ user: '', date: '', operation: '', ddt: '', product: '', lot: '', warehouse: '' })} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-accent">Azzera filtri</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[64rem] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">{['Data e ora', 'Utente', 'Operazione', 'DDT', 'Prodotto', 'Lotto', 'Magazzino', 'Dettaglio'].map((label) => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody>{filtered.map((row, index) => <tr key={`${row['Data e ora']}-${row.Utente}-${index}`} className="border-b border-border/60"><td className="px-3 py-3 tabular-nums">{String(row['Data e ora'] ?? '')}</td><td className="px-3 py-3 font-medium">{String(row.Utente ?? '')}</td><td className="px-3 py-3">{String(row.Operazione ?? '')}</td><td className="px-3 py-3">{String(row.DDT ?? '')}</td><td className="px-3 py-3">{String(row.Prodotto ?? '')}</td><td className="px-3 py-3">{String(row.Lotto ?? '')}</td><td className="px-3 py-3">{String(row.Magazzino ?? '')}</td><td className="max-w-80 px-3 py-3 text-muted-foreground">{String(row.Dettaglio ?? '')}</td></tr>)}</tbody></table></div>{hasRows ? null : <p className="mt-4 rounded-xl border border-dashed border-primary/30 p-5 text-sm text-muted-foreground">Nessuna attività corrisponde ai filtri selezionati.</p>}</Card></div>;
}

function Reports({ data, canExport }: { data: AppData; canExport: boolean }) {
  const [kind, setKind] = React.useState<ReportId>('giacenze');
  const [search, setSearch] = React.useState('');
  const rows = React.useMemo(() => buildReport(data, kind), [data, kind]);
  const filtered = rows.filter((row) => !search.trim() || Object.values(row).some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase())));
  const columns = Array.from(new Set(filtered.flatMap((row) => Object.keys(row))));
  const reportTitle = titleForReport(kind);
  const filename = `gestionale-sardegna-${kind}-${new Date().toISOString().slice(0, 10)}`;
  const downloadCsv = () => downloadFile(new Blob([Papa.unparse(filtered)], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`);
  const downloadExcel = () => {
    const table = `<table border="1"><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${filtered.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html><head><meta charset="utf-8"><title>${escapeHtml(reportTitle)}</title></head><body><h1>${escapeHtml(reportTitle)}</h1><p>Generato ${escapeHtml(new Date().toLocaleString('it-IT'))}</p>${table}</body></html>`;
    downloadFile(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' }), `${filename}.xls`);
  };
  const printPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const table = `<table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${filtered.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    printWindow.document.open();
    printWindow.document.write(`<html><head><meta charset="utf-8"><title>${escapeHtml(reportTitle)}</title><style>body{font:12px Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px;text-align:left;vertical-align:top}th{background:#eee}tr{page-break-inside:avoid}</style></head><body><h1>${escapeHtml(reportTitle)}</h1><p>Generato ${escapeHtml(new Date().toLocaleString('it-IT'))}</p>${table}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  const hasRows = filtered.length > 0;
  return <div className="space-y-5"><Card><div className="flex items-start gap-3"><span className="rounded-xl bg-primary/15 p-3 text-primary"><FileSpreadsheet size={22} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Analisi ed esportazioni</p><h2 className="mt-1 text-2xl font-semibold">REPORT GESTIONALE</h2><p className="mt-2 text-sm text-muted-foreground">I report sono calcolati sui dati correnti del gestionale.</p></div></div></Card><Card><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><label className="space-y-1 text-sm font-semibold"><span>Tipo di report</span><select value={kind} onChange={(event) => setKind(event.target.value as ReportId)} className="h-11 w-full rounded-xl border border-input bg-background px-3">{reportOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="space-y-1 text-sm font-semibold"><span>Cerca nei risultati</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Codice, cliente, DDT, lotto..." className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{reportTitle} · {filtered.length} righe</p><div className="flex flex-wrap gap-2"><button type="button" disabled={!canExport} onClick={downloadCsv} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-50"><ArrowDownToLine size={16} />CSV</button><button type="button" disabled={!canExport} onClick={downloadExcel} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"><FileSpreadsheet size={16} />Excel</button><button type="button" disabled={!canExport} onClick={printPdf} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-50"><FileText size={16} />PDF</button></div></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">{columns.map((column) => <th key={column} className="px-3 py-3">{column}</th>)}</tr></thead><tbody>{filtered.map((row, index) => <tr key={`${kind}-${index}`} className="border-b border-border/60">{columns.map((column) => <td key={column} className="px-3 py-3">{String(row[column] ?? '')}</td>)}</tr>)}</tbody></table></div>{hasRows ? null : <p className="mt-4 rounded-xl border border-dashed border-primary/30 p-5 text-sm text-muted-foreground">Non ci sono righe per questo report o filtro.</p>}<p className="mt-3 text-xs text-muted-foreground">PDF: si apre la stampa del browser, scegli “Salva come PDF”. Excel: file .xls compatibile con Excel.</p></Card></div>;
}

function Security({ isAdmin, staffExportAllowed, onSetStaffExport, exportSaving }: Pick<Props, 'isAdmin' | 'staffExportAllowed' | 'onSetStaffExport' | 'exportSaving'>) {
  const [error, setError] = React.useState('');
  const handleExportChange = async () => {
    setError('');
    try {
      await onSetStaffExport(!staffExportAllowed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Il permesso non è stato salvato.');
    }
  };
  return <div className="space-y-5"><Card><div className="flex items-start gap-3"><span className="rounded-xl bg-primary/15 p-3 text-primary"><ShieldCheck size={22} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Controlli account</p><h2 className="mt-1 text-2xl font-semibold">ADMIN · SICUREZZA</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Le protezioni che il provider non espone non vengono mostrate come interruttori attivi.</p></div></div></Card><Card><h3 className="text-lg font-semibold">Accesso</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4"><p className="font-semibold">Logout dopo 15 minuti</p><p className="mt-1 text-sm text-muted-foreground">Attivo per TITOLARE, AGENTI, TRANS ISOLE e OSPITE. ADMIN e STAFF restano esclusi.</p></div><div className="rounded-xl border border-border bg-background/50 p-4"><p className="font-semibold">Password per impostazioni, sessioni e nuovi dispositivi</p><p className="mt-1 text-sm text-muted-foreground">Richiesta, limite sessioni e verifica dispositivo dipendono dal provider di accesso e qui non sono attivabili.</p></div></div></Card><Card><h3 className="text-lg font-semibold">Azioni sensibili</h3><ul className="mt-3 space-y-2 text-sm text-muted-foreground"><li>Eliminazione carico o scarico e cancellazione DDT: conferma esplicita prima dell’eliminazione.</li><li>Modifica di quantità o lotto: seconda conferma prima del salvataggio.</li><li>La conferma riduce gli errori accidentali, ma non autentica nuovamente l’identità dell’amministratore.</li></ul></Card><Card className="border-primary/25 bg-primary/5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Permesso separato</p><h3 className="mt-1 text-lg font-semibold">Permetti esportazione dati a STAFF</h3><p className="mt-1 text-sm text-muted-foreground">Le esportazioni partono abilitate solo per ADMIN. Attiva il permesso per consentirle anche a STAFF.</p></div>{isAdmin ? <button type="button" role="switch" aria-checked={staffExportAllowed} disabled={exportSaving} onClick={() => { void handleExportChange(); }} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ${staffExportAllowed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-background'}`}>{exportSaving ? 'Salvataggio...' : staffExportAllowed ? 'ATTIVO' : 'OFF'}</button> : <span className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground">Solo ADMIN</span>}</div>{error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}</Card></div>;
}

export function AdminOperationsPanel({ view, data, isAdmin, canExport, staffExportAllowed, onSetStaffExport, exportSaving }: Props) {
  if (view === 'activity') return <ActivityRegister rows={data.accessi ?? []} />;
  if (view === 'reports') return <Reports data={data} canExport={canExport} />;
  return <Security isAdmin={isAdmin} staffExportAllowed={staffExportAllowed} onSetStaffExport={onSetStaffExport} exportSaving={exportSaving} />;
}
