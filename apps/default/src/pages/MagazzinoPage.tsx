import * as React from 'react';
import { ArrowDownToLine, ArrowUpToLine, Boxes, CalendarDays, ChevronDown, ChevronRight, Container, Crosshair, FileText, LockKeyhole, LogOut, MapPin, PackageOpen, RefreshCw, Settings2, ShoppingBag, Sparkles, Trash2, Truck, UserCircle, Warehouse } from 'lucide-react';
import { formatMetricTons } from '../services/magazzinoApi';


import { toast } from 'sonner';
import { CasseMatrix } from '../components/CasseMatrix';
import { TargheOperationsPanel } from '../components/TargheOperationsPanel';
import { LoadReservationPanel } from '../components/LoadReservationPanel';
import { DischargeProgramPanel } from '../components/DischargeProgramPanel';


import { TargheListPanel, TargheSearchPanel, type PlateRecord } from '../components/TargheSearchPanel';
import { SacconiMatrix, SacchiMatrix } from '../components/SacconiMatrix';
import { SiluriMatrix } from '../components/SiluriMatrix';
import { SiluriConsumptionTable } from '../components/SiluriConsumptionTable';
import { AdminUsersConsole } from '../components/AdminUsersConsole';
import { AdminOperationsPanel } from '../components/AdminOperationsPanel';
import { GaltieriFooter } from '../components/GaltieriFooter';
import { MangimiArchivePanel } from '../components/MangimiArchivePanel';
import { PendingRegistrationCard } from '../components/PendingRegistrationCard';
import { SettingsPanel } from '../components/SettingsPanel';
import { EpalAccountingPanel } from '../components/EpalAccountingPanel';
import { useAuth } from 'react-oidc-context';
import { activityAuditErrorText, allowedForExport, createNode, deleteNode, exportPermissionValue, field, getNodes, metricTons, numeric, PROJECTS, selectValue, setAuditActor, title, updateNode, type NodeRow, type ProjectKey } from '../services/magazzinoApi';
import { dateInputToRomeIso, formatRomeDate } from '../lib/rome-time';
import { productColorForCode } from '../lib/product-colors';

type Category = 'casse' | 'siluri' | 'sacconi' | 'sacchi';
type Tab = 'overview' | Category | 'stati' | 'ricercaTarga' | 'statiCasse' | 'statiSiluri' | 'statiCentinati' | 'epal' | 'scarichi' | 'bolleCarico' | 'bolleCaricoSiluri' | 'mangimi' | 'fileGiacenze' | 'admin' | 'bilici' | 'impostazioni' | 'registro' | 'report' | 'sicurezza';
const isPreviewHost = typeof window !== 'undefined' && (window.location.hostname.includes('taskade.com') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const previewEmail = 'wtp.igame@gmail.com';
const CASSA_DEPOSITO_CLIENT = 'DEPOSITO';

type CategoryIconProps = { size?: number; strokeWidth?: number; className?: string };

function CasseCategoryIcon({ size = 24, strokeWidth = 1.8, className = '' }: CategoryIconProps) {
  return <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center ${className}`}><Container size={size} strokeWidth={strokeWidth} /></span>;
}

function SiluriCategoryIcon({ size = 24, strokeWidth = 1.8, className = '' }: CategoryIconProps) {
  return <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center ${className}`}><Truck size={size} strokeWidth={strokeWidth} /><Boxes size={size * 0.48} strokeWidth={strokeWidth + 0.2} className="absolute bottom-[12%] left-[8%]" /></span>;
}

function SacconiCategoryIcon({ size = 24, strokeWidth = 1.8, className = '' }: CategoryIconProps) {
  return <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center ${className}`}><ShoppingBag size={size} strokeWidth={strokeWidth} /><span className="absolute bottom-[28%] h-[2px] w-[28%] rounded-full bg-current" /></span>;
}

function SacchiCategoryIcon({ size = 24, strokeWidth = 1.8, className = '' }: CategoryIconProps) {
  return <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center ${className}`}><PackageOpen size={size} strokeWidth={strokeWidth} /><span className="absolute bottom-[20%] left-[20%] h-[2px] w-[60%] rounded-full bg-current" /></span>;
}

function TargaSearchIcon({ size = 24, strokeWidth = 1.8, className = '' }: CategoryIconProps) {
  return <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center ${className}`}><MapPin size={size} strokeWidth={strokeWidth} /><Crosshair size={size * 0.42} strokeWidth={strokeWidth + 0.2} className="absolute bottom-[24%]" /></span>;
}

function EpalCategoryIcon({ size = 24, strokeWidth = 1.8, className = '' }: CategoryIconProps) {
  return <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center ${className}`}><Warehouse size={size} strokeWidth={strokeWidth} /><Boxes size={size * 0.44} strokeWidth={strokeWidth + 0.2} className="absolute bottom-[6%] left-[12%]" /></span>;
}

const categories: Array<{ id: Category; label: string; short: string; icon: React.ElementType; tone: string }> = [
  { id: 'casse', label: 'CASSE', short: 'Giacenza casse', icon: CasseCategoryIcon, tone: 'amber' },
  { id: 'siluri', label: 'SILURI', short: 'Giacenza siluri', icon: SiluriCategoryIcon, tone: 'cyan' },
  { id: 'sacconi', label: 'SACCONI', short: 'Giacenza sacconi', icon: SacconiCategoryIcon, tone: 'violet' },
  { id: 'sacchi', label: 'SACCHI', short: 'Giacenza sacchi', icon: SacchiCategoryIcon, tone: 'green' },
];

const statusLabels: Record<string, string> = { vuota: 'VUOTA', transito: 'IN TRANSITO', deposito: 'DEPOSITO CAGLIARI' };
const statusClass: Record<string, string> = { vuota: 'status-empty', transito: 'status-yellow', deposito: 'status-green' };

function Card({ children, className = '', dataMagazzinoTab }: { children: React.ReactNode; className?: string; dataMagazzinoTab?: string }) {
  return <section data-magazzino-tab={dataMagazzinoTab} className={`neon-panel rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur ${className}`}>{children}</section>;
}

function Metric({ label, value, detail, accent = 'text-primary' }: { label: string; value: string; detail: string; accent?: string }) {
  return <Card><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p><p className={`mt-3 text-3xl font-semibold tabular-nums ${accent}`}>{value}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></Card>;
}

const cassaMangimeCodes = ['1400', '1440', '1440R', '1440RI7', '1450', '1047SCPAF'];
const feedCodes = cassaMangimeCodes;
const feedColors = ['#7c3aed', '#00f5ff', '#c000ff', '#00ff85', '#ff2bd6', '#ffb000'];

function feedColorForCode(code: string) {
  const index = feedCodes.findIndex((item) => item.toUpperCase() === code.trim().toUpperCase());
  return feedColors[index >= 0 ? index : 0];
}

function cassaBalance(rows: NodeRow[], code: string, cassa: string) {
  const scopedRows = rows.filter((row) => String(field(row, '@cas01') ?? '').trim().toUpperCase() === code.trim().toUpperCase() && String(field(row, '@cas08') ?? '').trim() === cassa.trim());
  const sortedRows = scopedRows.slice().sort((left, right) => String(field(left, '@cas04') ?? '').localeCompare(String(field(right, '@cas04') ?? '')));
  return sortedRows.reduce((balance, row) => {
    const movementValue = selectValue(field(row, '@cas11'));
    const movement = movementValue === 'scarico' ? 'scarico' : 'carico';
    const quantity = numeric(field(row, '@cas06'));
    if (movement === 'carico') return selectValue(field(row, '@cas12')) === 'si' ? balance + quantity : balance;
    return balance - quantity;
  }, 0);
}

function globalCassaBalance(rows: NodeRow[], code: string) {
  const scopedRows = rows
    .filter((row) => String(field(row, '@cas01') ?? '').trim().toUpperCase() === code.trim().toUpperCase())
    .sort((left, right) => String(field(left, '@cas04') ?? '').localeCompare(String(field(right, '@cas04') ?? '')));
  return scopedRows.reduce((balance, row) => {
    const movementValue = selectValue(field(row, '@cas11'));
    const movement = movementValue === 'scarico' ? 'scarico' : 'carico';
    const quantity = numeric(field(row, '@cas06'));
    return movement === 'carico' ? balance + quantity : balance - quantity;
  }, 0);
}

function sackBalanceByCode(rows: NodeRow[], code: string, kind: 'sacconi' | 'sacchi') {
  const config = kind === 'sacconi' ? { code: '@sac01', qty: '@sac06', movement: '@sac10' } : { code: '@stk01', qty: '@stk06', movement: '@stk11' };
  return rows.filter((row) => String(field(row, config.code) ?? '').trim().toUpperCase() === code.toUpperCase()).reduce((balance, row) => selectValue(field(row, config.movement)) === 'scarico' ? balance - numeric(field(row, config.qty)) : balance + numeric(field(row, config.qty)), 0);
}

function siluriBalanceByCode(rows: NodeRow[], statusRows: NodeRow[]) {
  const statusByPlate = new Map(statusRows.map((row) => [String(field(row, '@sst01') ?? '').trim().toUpperCase(), row]));
  const statusByLoadId = new Map(statusRows.map((row) => [String(field(row, '@sst05') ?? '').trim(), row]));
  return rows.reduce<Record<string, number>>((balances, row) => {
    const code = String(field(row, '@sil01') ?? '').trim().toUpperCase();
    if (!code) return balances;
    const plate = String(field(row, '@sil07') ?? '').trim().toUpperCase();
    const statusRow = statusByLoadId.get(row.id) ?? statusByPlate.get(plate);
    const quantity = numeric(field(row, '@sil06'));
    const isEmpty = selectValue(field(statusRow, '@sst02')) === 'vuota';
    if (!isEmpty) balances[code] = (balances[code] ?? 0) + quantity;
    return balances;
  }, {});
}

function FeedStockDonutWidget({ rows, mangimiRows, editable, onRefresh }: { rows: NodeRow[]; mangimiRows: NodeRow[]; editable: boolean; onRefresh: () => Promise<void> }) {
  const denominationByCode = new Map(mangimiRows.map((row) => [String(field(row, '@cod01') ?? '').trim().toUpperCase(), String(field(row, '@den01') ?? '').trim()]));
  const cards = feedCodes.map((code, index) => {
    const quantity = Math.max(globalCassaBalance(rows, code), 0);
    const quantityTm = metricTons(quantity);
    const progress = Math.min(100, Math.max(0, (quantityTm / 28) * 100));
    const level = quantityTm >= 16 ? { label: 'Livello alto', color: '#b8ff72' } : quantityTm >= 8 ? { label: 'Livello medio', color: '#ffc46b' } : { label: 'Livello basso', color: '#ff8d8d' };
    return { code, quantity, quantityTm, progress: quantityTm > 28 ? 100 : progress, color: feedColors[index], denomination: denominationByCode.get(code.toUpperCase()) ?? '', level };
  });
  const total = cards.reduce((sum, card) => sum + card.quantity, 0);
  return <Card className="overflow-hidden"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Quadro generale</p><h2 className="mt-1 text-2xl font-semibold">GIACENZA CASSE PER MANGIME</h2><p className="mt-2 text-sm text-muted-foreground">Ogni codice mostra la giacenza e il livello mangime calcolato automaticamente.</p></div><div className="rounded-xl bg-accent px-3 py-2 text-right"><p className="text-xs uppercase tracking-wide text-muted-foreground">Totale</p><p className="text-xl font-semibold tabular-nums text-emerald-500">{formatMetricTons(total)} TM</p></div></div><div className="mt-6 grid gap-3" role="list" aria-label="Giacenza casse per codice mangime">{cards.map((card) => <div key={card.code} role="listitem" className="rounded-xl border bg-background/50 p-4" style={{ borderColor: `${card.color}66`, boxShadow: `0 0 18px ${card.color}18` }}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-base font-bold tracking-wide" style={{ color: card.color }}>{card.code}</p>{card.denomination && <p className="truncate text-xs text-muted-foreground">{card.denomination}</p>}</div><span className="rounded-full px-3 py-1 text-xs font-bold text-black" style={{ backgroundColor: card.level.color }}>{card.level.label}</span></div><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Giacenza</p><p className="mt-1 text-xl font-bold tabular-nums">{formatMetricTons(card.quantity)} TM</p></div><span className="text-sm font-bold tabular-nums" style={{ color: card.level.color }}>{Math.round(card.progress)}%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Livello mangime ${card.code}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(card.progress)}><div className="h-full rounded-full transition-all" style={{ width: `${Math.max(card.progress, card.quantityTm > 0 ? 5 : 0)}%`, backgroundColor: card.level.color, boxShadow: `0 0 12px ${card.level.color}99` }} /></div><LoadReservationPanel code={card.code} denomination={card.denomination} kind="CASSE" editable={editable} onRefresh={onRefresh} /></div>)}</div></Card>;
}

function siluriDateValue(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function siluriForecastTone(forecast: Date | null) {
  if (!forecast) return { barClassName: 'bg-slate-300', label: 'Previsione non disponibile' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const forecastDay = new Date(forecast);
  forecastDay.setHours(0, 0, 0, 0);
  const daysRemaining = Math.floor((forecastDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (daysRemaining <= 0) return { barClassName: 'bg-red-400', label: 'Carico urgente' };
  if (daysRemaining <= 2) return { barClassName: 'bg-yellow-300', label: 'Carico vicino' };
  return { barClassName: 'bg-lime-300', label: 'Autonomia disponibile' };
}

function siluriDateLabel(value: Date | null) {
  return value ? new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Europe/Rome' }).format(value) : 'N/D';
}

function SiluriStockOverviewWidget({ rows, statusRows, mangimiRows, consumptionRows, editable, onRefresh }: { rows: NodeRow[]; statusRows: NodeRow[]; mangimiRows: NodeRow[]; consumptionRows: NodeRow[]; editable: boolean; onRefresh: () => Promise<void> }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const codes = Array.from(new Set(mangimiRows.filter((row) => selectValue(field(row, '@cat01')).toLowerCase().includes('siluri')).map((row) => String(field(row, '@cod01') ?? '').trim().toUpperCase()).filter(Boolean)));
  const consumptionByCode = new Map(consumptionRows.map((row) => [String(field(row, '@csm01') ?? '').trim().toUpperCase().replace(/^TM(?=[A-Z0-9])/, ''), Number(field(row, '@csm02')) || 0]));
  const statusByPlate = new Map(statusRows.map((row) => [String(field(row, '@sst01') ?? '').trim().toUpperCase(), row]));
  const statusByLoadId = new Map(statusRows.map((row) => [String(field(row, '@sst05') ?? '').trim(), row]));
  const balances = siluriBalanceByCode(rows, statusRows);
  const total = codes.reduce((sum, code) => sum + Math.max(balances[code] ?? 0, 0), 0);
  const dayMs = 24 * 60 * 60 * 1000;
  const cards = codes.map((code) => {
    const codeRows = rows.filter((row) => String(field(row, '@sil01') ?? '').trim().toUpperCase() === code).sort((left, right) => String(field(right, '@sil04') ?? '').localeCompare(String(field(left, '@sil04') ?? '')));
    const latestRow = codeRows[0];
    const latestLoadDate = siluriDateValue(field(latestRow, '@sil04'));
    const plate = String(field(latestRow, '@sil07') ?? '').trim().toUpperCase();
    const latestPosition = siluriDateValue(field(statusByLoadId.get(latestRow?.id ?? '') ?? statusByPlate.get(plate), '@sst04'));
    const anchorDate = latestPosition ?? latestLoadDate;
    const dailyConsumption = consumptionByCode.get(code) ?? 0;
    const balanceTm = metricTons(balances[code] ?? 0);
    const elapsed = anchorDate ? Math.max(0, (now.getTime() - anchorDate.getTime()) / dayMs) : 0;
    const startingAutonomy = dailyConsumption > 0 ? Math.max(balanceTm / dailyConsumption, 0) : null;
    const autonomy = startingAutonomy !== null ? Math.max(startingAutonomy - elapsed, 0) : null;
    const forecast = startingAutonomy !== null && anchorDate ? new Date(anchorDate.getTime() + startingAutonomy * dayMs) : null;
    const tone = siluriForecastTone(forecast);
    const stockLevel = balanceTm >= 16 ? { label: 'Livello alto', color: '#b8ff72' } : balanceTm >= 8 ? { label: 'Livello medio', color: '#ffc46b' } : { label: 'Livello basso', color: '#ff8d8d' };
    const progress = startingAutonomy === null || startingAutonomy === 0 ? 0 : Math.min(100, Math.max(0, ((autonomy ?? 0) / startingAutonomy) * 100));
    return { code, balance: balances[code] ?? 0, autonomy, forecast, tone, stockLevel, progress, color: productColorForCode(code), denomination: String(field(mangimiRows.find((item) => String(field(item, '@cod01') ?? '').trim().toUpperCase() === code), '@den01') ?? '') };
  });
  return <Card className="overflow-hidden"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">Quadro generale</p><h2 className="mt-1 text-2xl font-semibold">GIACENZA SILURI PER MANGIME</h2><p className="mt-2 text-sm text-muted-foreground">Ogni codice mostra giacenza, autonomia residua e previsione del prossimo carico.</p></div><div className="rounded-xl bg-accent px-3 py-2 text-right"><p className="text-xs uppercase tracking-wide text-muted-foreground">Totale</p><p className="text-xl font-semibold tabular-nums text-emerald-500">{formatMetricTons(total)} TM</p></div></div><div className="mt-6 space-y-3" role="list" aria-label="Giacenza siluri, autonomia residua e previsione per codice">{cards.map((card) => <div key={card.code} role="listitem" className="rounded-xl border bg-background/50 p-4" style={{ borderColor: `${card.color}66`, boxShadow: `0 0 18px ${card.color}18` }}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-base font-bold tracking-wide" style={{ color: card.color }}>{card.code}</p></div><span className="rounded-full px-3 py-1 text-xs font-bold text-black" style={{ backgroundColor: card.stockLevel.color }}>{card.stockLevel.label}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Giacenza</p><p className="mt-1 font-bold tabular-nums" style={{ color: card.stockLevel.color }}>{formatMetricTons(card.balance)} TM</p></div><div><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Autonomia residua</p><p className="mt-1 font-bold tabular-nums">{card.autonomy === null ? 'N/D' : `${card.autonomy.toLocaleString('it-IT', { maximumFractionDigits: 1 })} giorni`}</p></div><div><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Previsione prossimo carico</p><p className="mt-1 font-bold tabular-nums">{siluriDateLabel(card.forecast)}</p></div></div><div className="mt-4"><div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-semibold text-muted-foreground"><span>Livello carico</span><span className="tabular-nums">{Math.round(card.progress)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Livello carico ${card.code}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(card.progress)}><div className="h-full rounded-full transition-all" style={{ width: `${card.progress}%`, backgroundColor: card.stockLevel.color, boxShadow: `0 0 12px ${card.stockLevel.color}99` }} /></div><LoadReservationPanel code={card.code} denomination={card.denomination} kind="SILURI" editable={editable} onRefresh={onRefresh} /></div></div>)}</div></Card>;
}

function CasseStatusWidget({ rows }: { rows: NodeRow[] }) {
  const emptyCount = rows.filter((row) => selectValue(field(row, '@cst03')) === 'vuota').length;
  const fullCount = rows.length - emptyCount;
  const hasStatusData = rows.length > 0;
  return <Card><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Targhe casse</p><h2 className="mt-1 text-xl font-semibold">Casse piene - Casse vuote</h2></div><Container className="text-primary" /></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-emerald-400/35 bg-emerald-400/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Casse piene</p><p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-500">{fullCount}</p></div><div className="rounded-xl border border-fuchsia-400/35 bg-fuchsia-400/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-400">Casse vuote</p><p className="mt-2 text-3xl font-semibold tabular-nums text-fuchsia-400">{emptyCount}</p></div></div>{!hasStatusData && <p className="mt-4 text-xs text-muted-foreground">In attesa del completamento della sezione TARGHE CASSE.</p>}</Card>;
}

function LastSiluroLoadWidget({ rows }: { rows: NodeRow[] }) {
  const ordered = rows.slice().sort((left, right) => String(field(right, '@sil04') ?? '').localeCompare(String(field(left, '@sil04') ?? '')));
  const lastLoad = ordered[0];
  const formatDate = (row: NodeRow | undefined) => {
    const value = String(field(row, '@sil04') ?? '');
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(date) : 'Data non disponibile';
  };
  const rawDdt = String(field(lastLoad, '@sil05') ?? '').trim();
  const ddtNumber = rawDdt.replace(/^DDT\s*/i, '').replace(/[^0-9].*$/, '') || 'Non indicato';
  return <Card><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">Movimenti siluri</p><h2 className="mt-1 text-xl font-semibold">ULTIMO CARICO SILURO</h2></div><ArrowUpToLine className="text-cyan-500" /></div>{lastLoad ? <div className="mt-5 rounded-xl border border-cyan-400/35 bg-cyan-400/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-500">Ultimo carico siluro</p><p className="mt-1 truncate text-lg font-semibold">{String(field(lastLoad, '@sil01') ?? 'Codice non indicato')}</p></div><SiluriCategoryIcon className="shrink-0 text-cyan-500" /></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div className="rounded-lg bg-background/60 p-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Data carico</p><p className="mt-1 font-semibold">{formatDate(lastLoad)}</p></div><div className="rounded-lg bg-background/60 p-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">TM</p><p className="mt-1 font-semibold tabular-nums">{formatMetricTons(field(lastLoad, '@sil06'))} TM</p></div><div className="rounded-lg bg-background/60 p-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Targa</p><p className="mt-1 font-semibold">{String(field(lastLoad, '@sil07') ?? 'Non indicata')}</p></div><div className="rounded-lg bg-background/60 p-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">DDT</p><p className="mt-1 font-semibold">{ddtNumber}</p></div></div></div> : <p className="mt-5 rounded-lg bg-background/60 p-3 text-sm text-muted-foreground">Nessun carico siluro registrato.</p>}</Card>;
}

function LastCassaDischargeWidget({ rows }: { rows: NodeRow[] }) {
  const ordered = rows.slice().sort((left, right) => String(field(right, '@cas04') ?? '').localeCompare(String(field(left, '@cas04') ?? '')));
  const lastLoad = ordered.find((row) => selectValue(field(row, '@cas11')) === 'carico');
  const lastDischarge = ordered.find((row) => selectValue(field(row, '@cas11')) === 'scarico');
  const formatDate = (row: NodeRow | undefined) => {
    const value = String(field(row, '@cas04') ?? '');
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(date) : 'Data non disponibile';
  };
  const MovementCard = ({ row, kind }: { row: NodeRow | undefined; kind: 'carico' | 'scarico' }) => {
    const isLoad = kind === 'carico';
    const client = String(field(row, '@cas09') ?? field(row, '@cas02') ?? 'Cliente non indicato');
    const product = String(field(row, '@cas01') ?? 'Prodotto non indicato');
    return <div className={`rounded-xl border p-4 ${isLoad ? 'border-emerald-400/35 bg-emerald-400/10' : 'border-orange-400/35 bg-orange-400/10'}`}><div className="flex items-start justify-between gap-3"><div><p className={`text-xs font-semibold uppercase tracking-wide ${isLoad ? 'text-emerald-500' : 'text-orange-400'}`}>{isLoad ? 'Ultimo carico cassa' : 'Ultimo scarico cassa'}</p><p className="mt-1 truncate text-lg font-semibold">{isLoad ? product : client}</p></div>{isLoad ? <ArrowUpToLine className="shrink-0 text-emerald-500" /> : <ArrowDownToLine className="shrink-0 text-orange-400" />}</div>{row ? <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div className="rounded-lg bg-background/60 p-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Data</p><p className="mt-1 font-semibold">{formatDate(row)}</p></div><div className="rounded-lg bg-background/60 p-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">TM</p><p className="mt-1 font-semibold tabular-nums">{formatMetricTons(field(row, '@cas06'))} TM</p></div><div className="col-span-2 rounded-lg bg-background/60 p-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Prodotto</p><p className="mt-1 font-semibold">{product}</p></div></div> : <p className="mt-4 rounded-lg bg-background/60 p-3 text-sm text-muted-foreground">Nessun {isLoad ? 'carico' : 'scarico'} cassa registrato.</p>}</div>;
  };
  return <Card><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Movimenti casse</p><h2 className="mt-1 text-xl font-semibold">MOVIMENTI CASSE</h2></div><ArrowUpToLine className="text-primary" /></div><div className="mt-5 grid gap-3"><MovementCard row={lastLoad} kind="carico" /><MovementCard row={lastDischarge} kind="scarico" /></div></Card>;
}

function DdtImportNotice() {
  return <p className="mt-5 rounded-xl border border-amber-400/35 bg-amber-400/10 p-3 text-sm text-amber-700 dark:text-amber-300">L’importazione automatica dei DDT è disattivata. Inserisci carichi e scarichi dal modulo manuale.</p>;
}

function BolleCaricoPanel({ rows, kind, editable, onRefresh }: { rows: NodeRow[]; kind: 'casse' | 'siluri' | 'sacconi' | 'sacchi'; editable: boolean; onRefresh: () => Promise<void> }) {
  const archiveConfig = { casse: { title: 'BOLLE DI CARICO CASSE', project: PROJECTS.bolleCarico, pdf: '@pdf01', ddt: '@pdf02', date: '@pdf03', code: '@pdf04' }, siluri: { title: 'BOLLE DI CARICO SILURI', project: PROJECTS.bolleCaricoSiluri, pdf: '@pdf01', ddt: '@pdf02', date: '@pdf03', code: '@pdf04' }, sacconi: { title: 'BOLLE DI CARICO SACCONI', project: PROJECTS.bolleCaricoSacconi, pdf: '@arc01', ddt: '@arc02', date: '@arc03', code: '@arc04' }, sacchi: { title: 'BOLLE DI CARICO SACCHI', project: PROJECTS.bolleCaricoSacchi, pdf: '@arc11', ddt: '@arc12', date: '@arc13', code: '@arc14' } }[kind];
  const orderedRows = rows.slice().reverse();
  const titleText = archiveConfig.title;
  const description = 'I DDT già archiviati restano disponibili insieme ai dati estratti. I nuovi carichi e scarichi si inseriscono manualmente.';
  const archiveProject = archiveConfig.project;
  const removeArchiveRow = async (row: NodeRow) => {
    if (!editable || !window.confirm('Eliminare questo DDT dall’archivio?')) return;
    try {
      await deleteNode(archiveProject, row.id);
      toast.success('DDT eliminato dall’archivio.');
      await onRefresh();
    } catch {
      toast.error('Il DDT non è stato eliminato.');
    }
  };
  return <Card><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Archivio documentale</p><h2 className="mt-1 text-xl font-semibold">{titleText}</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p></div><span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{rows.length} bolle</span></div>{orderedRows.length === 0 ? <div className="rounded-xl border border-dashed border-primary/30 bg-background/40 p-6 text-center text-sm text-muted-foreground">Nessuna bolla archiviata. I nuovi movimenti si registrano dal modulo manuale.</div> : <div className="space-y-3">{orderedRows.map((row) => { const pdfUrl = String(field(row, archiveConfig.pdf) ?? '').trim(); const ddt = String(field(row, archiveConfig.ddt) ?? '').trim().replace(/^DDT\s*/i, '').replace(/[^0-9].*$/, '') || 'Senza numero'; const date = formatRomeDate(field(row, archiveConfig.date)); const code = String(field(row, archiveConfig.code) ?? '').trim().replace(/^TM/i, ''); return <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-background/45 p-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">DDT CARICATI</p><p className="mt-1 text-xl font-bold tracking-wide text-primary">DDT {ddt} - {date || 'Data non indicata'} - {code || 'Codice non indicato'}</p></div>{pdfUrl ? <div className="flex flex-wrap gap-2"><a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"><FileText size={17} />Apri PDF</a><a href={pdfUrl} download target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20"><ArrowDownToLine size={17} />Scarica PDF</a></div> : <span className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">PDF non disponibile</span>}{editable && <button type="button" onClick={() => { void removeArchiveRow(row); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-500/60 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-500/20"><Trash2 size={17} />Elimina</button>}</article>; })}</div>}</Card>;
}

function EditableNote({ row, fieldId, projectId, editable, onRefresh }: { row: NodeRow; fieldId: string; projectId: string; editable: boolean; onRefresh: () => Promise<void> }) {
  const [value, setValue] = React.useState(String(field(row, fieldId) ?? ''));
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { setValue(String(field(row, fieldId) ?? '')); }, [row, fieldId]);
  const save = async () => {
    const nextValue = value.trim();
    const currentValue = String(field(row, fieldId) ?? '').trim();
    if (!editable || saving || nextValue === currentValue) return;
    setSaving(true);
    try {
      await updateNode(projectId, row.id, { [`/attributes/${fieldId}`]: nextValue });
      await onRefresh();
    } catch {
      toast.error('La nota non è stata salvata.');
    } finally {
      setSaving(false);
    }
  };
  return <textarea aria-label={`Note ${title(row)}`} value={value} disabled={!editable || saving} onChange={(event) => setValue(event.target.value)} onBlur={() => { void save(); }} placeholder="Inserisci una nota" rows={2} className="w-64 min-w-0 resize-y rounded-lg border border-input bg-background/45 px-2 py-1 text-sm font-normal normal-case outline-none focus:ring-2 focus:ring-ring disabled:opacity-60" />;
}

function DataTable({ rows, category, editable, onRefresh }: { rows: NodeRow[]; category: Category; editable: boolean; onRefresh: () => Promise<void> }) {
  const configs = {
    casse: { code: '@cas01', name: '@cas02', lot: '@cas03', ddt: '@cas05', qty: '@cas06', plate: '@cas07', extra: '@cas08', note: '@cas10', available: '@cas12' },
    siluri: { code: '@sil01', name: '@sil02', lot: '@sil03', ddt: '@sil05', qty: '@sil06', plate: '@sil07', extra: '@sil08', note: '@sil09', available: '@sil11' },
    sacconi: { code: '@sac01', name: '@sac02', lot: '@sac03', ddt: '@sac05', qty: '@sac06', plate: '@sac07', extra: '@sac08', note: '@sac09', available: '@sac11' },
    sacchi: { code: '@stk01', name: '@stk02', lot: '@stk03', ddt: '@stk05', qty: '@stk06', plate: '@stk07', extra: '@stk08', epal: '@stk09', note: '@stk10', available: '@stk12' },
  }[category];
  const extraLabel = category === 'casse' ? 'N. Cassa' : category === 'siluri' ? 'Cliente' : category === 'sacconi' ? 'N. Sacconi' : 'N. Sacchi';
  const labels = ['Codice', 'Denominazione', 'Lotto', 'DDT', 'TM', 'Targa', extraLabel, ...(category === 'sacchi' ? ['EPAL'] : []), 'Disponibile', 'Note'];
  return <div className="w-full overflow-hidden"><table className="matrix-table mobile-stack-table w-full table-fixed text-left text-sm uppercase"><thead><tr className="border-b border-border text-sm tracking-wide text-muted-foreground">{labels.map((labelText) => <th key={labelText} className={`${labelText === 'Note' ? 'w-64 min-w-64' : ''} px-2 py-2 font-semibold`}>{labelText}</th>)}</tr></thead><tbody>{rows.map((row) => { const available = selectValue(field(row, configs.available)) === 'si'; return <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40"><td data-label="CODICE" className="px-2 py-2 font-medium">{String(field(row, configs.code) ?? '')}</td><td data-label="DENOMINAZIONE" className="px-2 py-2">{String(field(row, configs.name) ?? title(row))}</td><td data-label="LOTTO" className="px-2 py-2 text-muted-foreground">{String(field(row, configs.lot) ?? '')}</td><td data-label="DDT" className="px-2 py-2 text-muted-foreground">{String(field(row, configs.ddt) ?? '')}</td><td data-label="TM" className="px-2 py-2 font-semibold tabular-nums">{formatMetricTons(field(row, configs.qty))}</td><td data-label="TARGA" className="px-2 py-2">{String(field(row, configs.plate) ?? '')}</td><td data-label={extraLabel} className="px-2 py-2 tabular-nums">{String(field(row, configs.extra) ?? '')}</td>{category === 'sacchi' && <td data-label="EPAL" className="px-2 py-2 tabular-nums">{numeric(field(row, configs.epal ?? '@stk09')).toLocaleString('it-IT')}</td>}<td data-label="DISPONIBILE" className="px-2 py-2"><input aria-label={`Disponibilità ${title(row)}`} type="checkbox" checked={available} readOnly className="h-4 w-4 accent-primary" /></td><td data-label="NOTE" className="w-64 min-w-64 px-2 py-2"><EditableNote row={row} fieldId={configs.note} projectId={PROJECTS[category]} editable={editable} onRefresh={onRefresh} /></td></tr>; })}</tbody></table></div>;
}

function StatusTable({ rows, kind }: { rows: NodeRow[]; kind: 'casse' | 'siluri' }) {
  const stateKey = kind === 'casse' ? '@cst03' : '@sst02';
  return <div className="grid gap-3 md:grid-cols-2">{rows.map((row) => { const state = selectValue(field(row, stateKey)); return <div key={row.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 p-4"><div className="min-w-0"><p className="font-semibold">{String(field(row, kind === 'casse' ? '@cst01' : '@sst01') ?? '')}</p><p className="text-sm text-muted-foreground">{kind === 'casse' ? `Cassa ${String(field(row, '@cst02') ?? '')}` : String(field(row, '@sst03') ?? '')}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[state] ?? 'status-empty'}`}>{statusLabels[state] ?? 'Vuota'}</span></div>; })}</div>;
}

function stockExportRows(data: Record<ProjectKey, NodeRow[]>, mangimiRows: NodeRow[]) {
  const catalog = new Map(mangimiRows.map((row) => [String(field(row, '@cod01') ?? '').trim().toUpperCase(), { name: String(field(row, '@den01') ?? '').trim(), category: selectValue(field(row, '@cat01')).toLowerCase() }]));
  const configs = { casse: { rows: data.casse ?? [], code: '@cas01', date: '@cas04', balance: (code: string) => globalCassaBalance(data.casse ?? [], code) }, siluri: { rows: data.siluri ?? [], code: '@sil01', date: '@sil04', balance: (code: string) => siluriBalanceByCode(data.siluri ?? [], data.statiSiluri ?? [])[code] ?? 0 }, sacconi: { rows: data.sacconi ?? [], code: '@sac01', date: '@sac04', balance: (code: string) => sackBalanceByCode(data.sacconi ?? [], code, 'sacconi') }, sacchi: { rows: data.sacchi ?? [], code: '@stk01', date: '@stk04', balance: (code: string) => sackBalanceByCode(data.sacchi ?? [], code, 'sacchi') } } as const;
  return (Object.keys(configs) as Category[]).flatMap((category) => { const config = configs[category]; const codes = Array.from(new Set([...mangimiRows.filter((row) => catalog.get(String(field(row, '@cod01') ?? '').trim().toUpperCase())?.category.includes(category)).map((row) => String(field(row, '@cod01') ?? '').trim().toUpperCase()), ...config.rows.map((row) => String(field(row, config.code) ?? '').trim().toUpperCase())])).filter(Boolean); return codes.map((code) => { const scoped = config.rows.filter((row) => String(field(row, config.code) ?? '').trim().toUpperCase() === code); const latest = scoped.slice().sort((left, right) => String(field(right, config.date) ?? '').localeCompare(String(field(left, config.date) ?? '')))[0]; const nameField = category === 'casse' ? '@cas02' : category === 'siluri' ? '@sil02' : category === 'sacconi' ? '@sac02' : '@stk02'; return { category: category.toUpperCase(), code, name: catalog.get(code)?.name ?? String(field(latest, nameField) ?? ''), quantity: Math.max(metricTons(config.balance(code)), 0), lastMovement: String(field(latest, config.date) ?? '') }; }).filter((row) => row.quantity > 0); });
}

function formatStockMovementDay(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeZone: 'Europe/Rome' }).format(date);
}

function buildStockPdf(lines: string[]) {
  const escapePdf = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '').replace(/[()\\]/g, '\\$&');
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / 44)) }, (_, index) => lines.slice(index * 44, index * 44 + 44));
  const objects: string[] = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pageIds: string[] = [];
  pages.forEach((page, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    pageIds.push(`${pageId} 0 R`);
    const contentLines = ['BT', '/F1 9 Tf', '40 800 Td'];
    page.forEach((line, lineIndex) => { contentLines.push(`(${escapePdf(line)}) Tj`); if (lineIndex < page.length - 1) contentLines.push('0 -16 Td'); });
    const content = contentLines.concat('ET').join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  objects[1] = `<< /Type /Pages /Kids [${pageIds.join(' ')}] /Count ${pages.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function StockExportsPanel({ data }: { data: Record<ProjectKey, NodeRow[]> }) {
  const rows = React.useMemo(() => stockExportRows(data, data.mangimi ?? []), [data]);
  const [generatedAt, setGeneratedAt] = React.useState(() => new Date().toISOString());
  const [previousAt, setPreviousAt] = React.useState<string | null>(null);
  const formatDate = (value: string) => new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(value));
  const generate = React.useCallback(() => { setPreviousAt(generatedAt); setGeneratedAt(new Date().toISOString()); }, [generatedAt]);
  React.useEffect(() => { const timer = window.setInterval(generate, 3 * 60 * 60 * 1000); return () => window.clearInterval(timer); }, [generate]);
  const tableHtml = (titleText: string) => `<html><head><meta charset="utf-8"><title>${titleText}</title></head><body><h1>${titleText}</h1><p>Contiene CASSE, SILURI, SACCONI e SACCHI, con codici attivi e giacenza superiore a 0, aggiornati al ${formatDate(generatedAt)}.</p><table border="1"><tr><th>Categoria</th><th>Codice</th><th>Denominazione</th><th>Giacenza TM</th><th>Ultimo movimento</th></tr>${rows.map((row) => `<tr><td>${row.category}</td><td>${row.code}</td><td>${row.name}</td><td>${row.quantity.toLocaleString('it-IT')}</td><td>${formatStockMovementDay(row.lastMovement)}</td></tr>`).join('')}</table></body></html>`;
  const downloadExcel = () => { const blob = new Blob([tableHtml('GIACENZE PRODOTTI')], { type: 'application/vnd.ms-excel' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `giacenze-prodotti-${generatedAt.slice(0, 16).replaceAll(':', '-')}.xls`; link.click(); URL.revokeObjectURL(url); toast.success('File Excel compatibile scaricato.'); };
  const downloadPdf = () => {
    const lines = [
      'GIACENZE PRODOTTI',
      `Contiene CASSE, SILURI, SACCONI e SACCHI, aggiornati al ${formatDate(generatedAt)}.`,
      '',
      'Categoria | Codice | Denominazione | Giacenza TM | Ultimo movimento',
      ...rows.map((row) => `${row.category} | ${row.code} | ${row.name || 'N/D'} | ${row.quantity.toLocaleString('it-IT')} | ${formatStockMovementDay(row.lastMovement) || 'N/D'}`),
    ];
    const blob = buildStockPdf(lines);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `giacenze-prodotti-${generatedAt.slice(0, 16).replaceAll(':', '-')}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Download PDF avviato. Scegli dove salvarlo nel browser.');
  };
  return <Card><div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Esportazione controllata</p><h2 className="mt-1 text-xl font-semibold">SCARICA FILE GIACENZE PRODOTTI</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Il file contiene quattro sezioni separate, CASSE, SILURI, SACCONI e SACCHI, con i codici attivi e quelli con giacenza superiore a 0, la giacenza aggiornata e l’ultimo movimento.</p></div><span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-500">{rows.length} righe attive</span></div><div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border-2 border-lime-400/70 bg-lime-300/15 p-4"><p className="text-xs font-bold uppercase tracking-wide text-lime-700 dark:text-lime-300">Ultima giacenza generata</p><p className="mt-2 font-semibold">{formatDate(generatedAt)}</p><p className="mt-1 text-sm text-muted-foreground">Versione corrente, evidenziata in verde fluo.</p></div><div className="rounded-xl border-2 border-orange-400/70 bg-orange-300/15 p-4"><p className="text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">Ultima giacenza del giorno prima</p><p className="mt-2 font-semibold">{previousAt ? formatDate(previousAt) : 'Non ancora disponibile'}</p><p className="mt-1 text-sm text-muted-foreground">Versione storica, evidenziata in arancione fluo.</p></div></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={downloadExcel} className="min-h-11 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><FileText className="mr-2 inline" size={17} />Scarica Excel</button><button type="button" onClick={downloadPdf} className="min-h-11 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-accent"><ArrowDownToLine className="mr-2 inline" size={17} />Scarica PDF</button><button type="button" onClick={generate} className="min-h-11 rounded-xl border border-lime-400/60 px-4 py-3 text-sm font-semibold text-lime-600 hover:bg-lime-400/10">Genera ora</button></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[44rem] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Categoria</th><th className="px-3 py-3">Codice</th><th className="px-3 py-3">Denominazione</th><th className="px-3 py-3">Giacenza TM</th><th className="px-3 py-3">Ultimo movimento</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.category}-${row.code}`} className="border-b border-border/60"><td className="px-3 py-3 font-semibold">{row.category}</td><td className="px-3 py-3 font-mono font-bold">{row.code}</td><td className="px-3 py-3">{row.name || 'N/D'}</td><td className="px-3 py-3 font-bold tabular-nums text-lime-500">{row.quantity.toLocaleString('it-IT')}</td><td className="px-3 py-3 text-muted-foreground">{formatStockMovementDay(row.lastMovement) || 'N/D'}</td></tr>)}</tbody></table></div></Card>;
}



function BiliciPanel({ rows, requesterEmail, editable, canViewAll, onRefresh }: { rows: NodeRow[]; requesterEmail: string; editable: boolean; canViewAll: boolean; onRefresh: () => Promise<void> }) {
  const [plate, setPlate] = React.useState('');
  const [requestText, setRequestText] = React.useState('');
  const [additionalRecipients, setAdditionalRecipients] = React.useState('');
  const [consent, setConsent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const visibleRows = canViewAll ? rows : rows.filter((row) => String(field(row, '@bil03') ?? '').trim().toLowerCase() === requesterEmail.toLowerCase());
  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editable || !plate.trim() || !requesterEmail || !consent) return;
    setBusy(true);
    try {
      await createNode(PROJECTS.bilici, { '/text': `Richiesta ${plate.trim().toUpperCase()}`, '/attributes/@bil01': plate.trim().toUpperCase(), '/attributes/@bil02': requestText.trim() || 'Rintracciare la targa indicata', '/attributes/@bil03': requesterEmail, '/attributes/@bil04': 'nuova', '/attributes/@bil06': new Date().toISOString() });
      const response = await fetch('/api/taskade/webhooks/01M21S7NMRAMAG6GBJPX1XJ9JZ/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plate: plate.trim().toUpperCase(), requestText: requestText.trim() || 'Rintracciare la targa indicata', requesterEmail, additionalRecipients: additionalRecipients.trim(), consent: 'autorizzato' }) });
      if (!response.ok) throw new Error('La richiesta email non è stata accettata.');
      setPlate(''); setRequestText(''); setAdditionalRecipients(''); setConsent(false);
      toast.success('Richiesta inviata a ordini@transisole.com. La risposta comparirà qui e via email.');
      await onRefresh();
    } catch { toast.error('Imposta un destinatario valido e riprova.'); }
    finally { setBusy(false); }
  };
  return <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><Card><div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Rintraccio operativo</p><h2 className="mt-1 text-xl font-semibold">RICERCA TARGA</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Solo Admin e Staff possono inviare richieste; gli altri ruoli possono consultare le risposte.</p></div><form onSubmit={submitRequest} className="space-y-4"><label className="block space-y-2 text-sm font-semibold"><span>Targa da rintracciare</span><input required disabled={!editable} value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="AA123BB" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal uppercase" /></label><label className="block space-y-2 text-sm font-semibold"><span>Dettagli della richiesta</span><textarea disabled={!editable} value={requestText} onChange={(event) => setRequestText(event.target.value)} placeholder="Eventuali informazioni aggiuntive" className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 font-normal" /></label><label className="block space-y-2 text-sm font-semibold"><span>Altri indirizzi email, facoltativi</span><input type="text" disabled={!editable} value={additionalRecipients} onChange={(event) => setAdditionalRecipients(event.target.value)} placeholder="separa più indirizzi con ;" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label><label className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm"><input required type="checkbox" disabled={!editable} checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" /><span>Autorizzo l’invio della richiesta email dalla mia sessione. La risposta sarà indirizzata alla casella operativa e potrà essere replicata alla mia email.</span></label><button disabled={!editable || busy || !consent} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Invio in corso...' : 'Invia richiesta'}</button></form></Card><Card><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Conversazione operativa</p><h2 className="mt-1 text-xl font-semibold">Richieste e risposte</h2></div><Truck className="text-primary" /></div><div className="space-y-3">{visibleRows.length === 0 && <p className="rounded-xl bg-accent/60 p-4 text-sm text-muted-foreground">Nessuna richiesta ancora per questo account.</p>}{visibleRows.slice().reverse().map((row) => <div key={row.id} className="rounded-xl border border-border/70 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{String(field(row, '@bil01') ?? title(row))}</p><span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold">{selectValue(field(row, '@bil04')) || 'nuova'}</span></div><p className="mt-2 text-sm text-muted-foreground">{String(field(row, '@bil02') ?? '')}</p>{String(field(row, '@bil05') ?? '').trim() && <p className="mt-3 rounded-lg bg-background p-3 text-sm"><span className="font-semibold">Risposta: </span>{String(field(row, '@bil05'))}</p>}</div>)}</div></Card></div>;
}

function SackCodePanel({ kind, codes, rows, mangimiRows, selectedCode, onSelect, onLoad, onDischarge, editable, onRefresh }: { kind: 'sacconi' | 'sacchi'; codes: string[]; rows: NodeRow[]; mangimiRows: NodeRow[]; selectedCode: string; onSelect: (code: string) => void; onLoad: (code: string) => void; onDischarge: (code: string) => void; editable: boolean; onRefresh: () => Promise<void> }) {
  const [showNewCode, setShowNewCode] = React.useState(false);
  const [newCode, setNewCode] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [savingCode, setSavingCode] = React.useState(false);
  const addCode = async () => {
    const code = newCode.trim().toUpperCase();
    const name = newName.trim();
    if (!editable || !code || !name || savingCode) return;
    if (mangimiRows.some((row) => String(field(row, '@cod01') ?? '').trim().toUpperCase() === code)) {
      toast.error('Questo codice è già presente in archivio.');
      return;
    }
    setSavingCode(true);
    try {
      await createNode(PROJECTS.mangimi, { '/text': name, '/attributes/@cod01': code, '/attributes/@den01': name, '/attributes/@cat01': kind });
      onSelect(code);
      setNewCode(''); setNewName(''); setShowNewCode(false);
      toast.success(`Codice ${code} aggiunto con la denominazione ${name}.`);
      void onRefresh().catch(() => toast.error('Codice aggiunto, ma non è stato possibile aggiornare la vista.'));
    } catch {
      toast.error('Il nuovo codice non è stato inserito. Controlla codice e denominazione.');
    } finally {
      setSavingCode(false);
    }
  };
  return <div className="mb-5 rounded-2xl border border-primary/25 bg-background/45 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">GIACENZA PER CODICE</p><p className="mt-1 text-sm text-muted-foreground">Verde fluo indica merce disponibile, rosso fluo indica codice scaricato e senza giacenza.</p></div><span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">{codes.length} codici</span></div><div className="mt-4 flex flex-wrap gap-2">{codes.map((code) => { const balance = sackBalanceByCode(rows, code, kind); const active = balance > 0.3; const denomination = String(field(mangimiRows.find((item) => String(field(item, '@cod01') ?? '').trim().toUpperCase() === code.toUpperCase()), '@den01') ?? '').trim(); return <div key={code} className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => onSelect(code)} className={`min-h-11 rounded-xl border-2 px-4 py-2 text-left transition ${selectedCode === code ? 'ring-2 ring-primary' : ''}`} style={{ borderColor: active ? '#39ff14' : '#ff334f', color: active ? '#39ff14' : '#ff334f', backgroundColor: active ? 'rgba(57,255,20,0.12)' : 'rgba(255,51,79,0.12)', boxShadow: active ? '0 0 14px rgba(57,255,20,0.28)' : '0 0 14px rgba(255,51,79,0.22)' }}><span className="block font-mono text-sm font-bold">{code}</span><span className="block max-w-48 truncate text-xs font-medium">{denomination || 'Nome mangime non indicato'}</span></button>{editable && <><button type="button" onClick={() => onLoad(code)} className="min-h-11 rounded-xl border border-emerald-400/60 px-3 text-xs font-bold text-emerald-500">+ CARICO</button><button type="button" disabled={!active} onClick={() => onDischarge(code)} className="min-h-11 rounded-xl border border-orange-400/60 px-3 text-xs font-bold text-orange-500 disabled:opacity-40">+ SCARICO</button></>}</div>; })}{editable && <button type="button" onClick={() => setShowNewCode((value) => !value)} className="min-h-11 rounded-xl border border-dashed border-primary/60 px-4 text-sm font-semibold text-primary hover:bg-primary/10">+ Nuovo codice</button>}</div>{showNewCode && editable && <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(8rem,0.7fr)_minmax(12rem,1.3fr)_auto]"><label className="space-y-1 text-sm font-semibold"><span>Codice mangime</span><input value={newCode} onChange={(event) => setNewCode(event.target.value.toUpperCase())} autoComplete="off" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-mono font-normal" /></label><label className="space-y-1 text-sm font-semibold"><span>Nome del mangime</span><input value={newName} onChange={(event) => setNewName(event.target.value)} autoComplete="off" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label><button type="button" disabled={!newCode.trim() || !newName.trim() || savingCode} onClick={() => { void addCode(); }} className="min-h-11 self-end rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{savingCode ? 'Salvataggio...' : 'Salva codice'}</button></div>}</div>;
}

export default function MagazzinoPage() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = React.useState<Tab>('overview');
  const [mobileNavCollapsed, setMobileNavCollapsed] = React.useState(false);
  const [viewAsRole, setViewAsRole] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Record<ProjectKey, NodeRow[]>>({} as Record<ProjectKey, NodeRow[]>);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [readOnly, setReadOnly] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [formCategory, setFormCategory] = React.useState<Category>('casse');
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [selectedCassaCode, setSelectedCassaCode] = React.useState(cassaMangimeCodes[0]);
  const [selectedSiluriCode, setSelectedSiluriCode] = React.useState('');
  const [selectedSacconiCode, setSelectedSacconiCode] = React.useState('');
  const [selectedSacchiCode, setSelectedSacchiCode] = React.useState('');
  const [newCassaCode, setNewCassaCode] = React.useState('');
  const [showNewCassaCode, setShowNewCassaCode] = React.useState(false);
  const [liveRefresh, setLiveRefresh] = React.useState(true);
  const [lastRefreshAt, setLastRefreshAt] = React.useState<Date | null>(null);

  const load = React.useCallback(async () => {
    if (!auth.isAuthenticated && !isPreviewHost) return;
    setRefreshing(true);
    try {
      const entries = await Promise.all(Object.entries(PROJECTS).map(async ([key, id]) => [key, await getNodes(id)] as const));
      const entryMap = Object.fromEntries(entries) as Record<ProjectKey, NodeRow[]>;
      const retentionCutoff = Date.now() - 40 * 24 * 60 * 60 * 1000;
      const archiveProjects = ['bolleCarico', 'bolleCaricoSiluri', 'bolleCaricoSacconi', 'bolleCaricoSacchi'] as const;
      for (const archiveKey of archiveProjects) {
        const archiveDateField = archiveKey === 'bolleCarico' ? '@pdf10' : archiveKey === 'bolleCaricoSiluri' ? '@pdf10' : archiveKey === 'bolleCaricoSacconi' ? '@arc10' : '@arc21';
        const expiredBolle = (entryMap[archiveKey] ?? []).filter((row) => {
          const importedAt = String(field(row, archiveDateField) ?? '').trim();
          const timestamp = Date.parse(importedAt);
          return Number.isFinite(timestamp) && timestamp < retentionCutoff;
        });
        if (expiredBolle.length > 0) {
          const cleanupResults = await Promise.allSettled(expiredBolle.map((row) => deleteNode(PROJECTS[archiveKey], row.id)));
          const deletedIds = new Set(expiredBolle.filter((_, index) => cleanupResults[index]?.status === 'fulfilled').map((row) => row.id));
          entryMap[archiveKey] = (entryMap[archiveKey] ?? []).filter((row) => !deletedIds.has(row.id));
        }
      }
      setData(entryMap);
      setLastRefreshAt(new Date());
    } catch (error) {
      toast.error('Non riesco a leggere i dati del magazzino.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [auth.isAuthenticated]);

  React.useEffect(() => { void load(); }, [load]);
  React.useEffect(() => {
    if (!liveRefresh) return undefined;
    const timer = window.setInterval(() => { void load(); }, 30000);
    return () => window.clearInterval(timer);
  }, [liveRefresh, load]);

  const currentEmail = String(auth.user?.profile.email ?? '').trim().toLowerCase() || (isPreviewHost ? previewEmail : '');
  const matchingUser = (data.utenti ?? []).find((row) => String(field(row, '@usr01') ?? '').trim().toLowerCase() === currentEmail);
  const userDisplayName = String(field(matchingUser, '@usr02') ?? '').trim() || String(auth.user?.profile.name ?? '').trim() || 'Utente';
  const accessStatus = selectValue(field(matchingUser, '@usr03'));
  const userRole = selectValue(field(matchingUser, '@usr04'));
  const userRoleLabel: Record<string, string> = { admin: 'ADMIN', titolare: 'TITOLARE', staff: 'STAFF', agente: 'AGENTI', 'trans-isole': 'TRANS ISOLE', ospite: 'OSPITE' };
  const previewRoleOptions = ['staff', 'titolare', 'agente', 'trans-isole', 'ospite'];
  const isApproved = accessStatus === 'approvato';
  const actualIsAdmin = userRole === 'admin' || currentEmail === 'dariodimarobroker@gmail.com';
  const actualIsStaff = userRole === 'staff';
  const isRolePreview = actualIsAdmin && viewAsRole !== null;
  const effectiveRole = isRolePreview ? viewAsRole : userRole;
  const isAdmin = actualIsAdmin && !isRolePreview;
  const canAccessAdmin = isApproved && isAdmin;
  const canAccessEpal = isApproved && isAdmin;
  const canSeeEpalWidget = isApproved && isAdmin;
  const isOwner = !isRolePreview && isApproved && (actualIsAdmin || actualIsStaff);
  const canManage = !isRolePreview && isApproved && (actualIsAdmin || actualIsStaff);
  const currentSettingsRow = (data.impostazioni ?? []).find((row) => String(field(row, '@set01') ?? '').trim().toLowerCase() === currentEmail);
  const staffExportAllowed = exportPermissionValue(currentSettingsRow);
  const saveStaffExport = async (enabled: boolean) => {
    const value = { type: 'Select', optionId: enabled ? 'on' : 'off' };
    if (currentSettingsRow) {
      await updateNode(PROJECTS.impostazioni, currentSettingsRow.id, { '/attributes/@4f10a': value, '/attributes/@set08': new Date().toISOString() });
    } else {
      await createNode(PROJECTS.impostazioni, { '/text': `Impostazioni ${currentEmail}`, '/attributes/@set01': currentEmail, '/attributes/@set02': userDisplayName, '/attributes/@set03': userRole || 'ospite', '/attributes/@set04': 'on', '/attributes/@set05': 'on', '/attributes/@set06': 'on', '/attributes/@set07': 'on', '/attributes/@set08': new Date().toISOString(), '/attributes/@4f10a': value });
    }
    await load();
  };
  React.useEffect(() => {
    setAuditActor({ name: userDisplayName, email: currentEmail, role: userRole });
  }, [currentEmail, userDisplayName, userRole]);
  React.useEffect(() => {
    if (!auth.isAuthenticated || !isApproved || actualIsAdmin || actualIsStaff) return undefined;
    let timer = 0;
    const signOutWhenIdle = () => {
      toast.info('La sessione è stata chiusa dopo 15 minuti di inattività.');
      void auth.signoutRedirect();
    };
    const resetIdleTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(signOutWhenIdle, 15 * 60 * 1000);
    };
    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }));
    resetIdleTimer();
    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
    };
  }, [auth.isAuthenticated, auth.signoutRedirect, isApproved, actualIsAdmin, actualIsStaff]);
  React.useEffect(() => {
    const onAuditFailure = () => toast.warning(activityAuditErrorText());
    window.addEventListener('magazzino:audit-write-failed', onAuditFailure);
    return () => window.removeEventListener('magazzino:audit-write-failed', onAuditFailure);
  }, []);
  const accessLogged = React.useRef(false);
  React.useEffect(() => {
    if (isApproved && currentEmail && !accessLogged.current && !isPreviewHost) {
      accessLogged.current = true;
      void createNode(PROJECTS.accessi, { '/text': `${currentEmail} - Accesso`, '/attributes/@acc01': currentEmail, '/attributes/@acc02': String(auth.user?.profile.name ?? currentEmail), '/attributes/@acc03': new Date().toISOString(), '/attributes/@acc04': 'accesso', '/attributes/@acc05': 'Google / GenesisAuth' }).catch(() => undefined);
    }
  }, [auth.user?.profile.name, currentEmail, isApproved]);
  const sentEpal = (data.epal ?? []).filter((row) => selectValue(field(row, '@epa03')) === 'spedita').reduce((sum, row) => sum + numeric(field(row, '@epa04')), 0);
  const returnedEpal = (data.epal ?? []).filter((row) => selectValue(field(row, '@epa03')) === 'rientrata').reduce((sum, row) => sum + numeric(field(row, '@epa04')), 0);
  const availableCassaCodes = React.useMemo(() => Array.from(new Set([...cassaMangimeCodes, ...(data.casse ?? []).map((row) => String(field(row, '@cas01') ?? '').trim().toUpperCase()).filter(Boolean)])), [data.casse]);
  const plateOptions = React.useMemo(() => Array.from(new Set((data.bilici ?? []).map((row) => String(field(row, '@bil01') ?? '').trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right)), [data.bilici]);
  const availableSiluriCodes = React.useMemo(() => Array.from(new Set((data.mangimi ?? []).filter((row) => selectValue(field(row, '@cat01')).toLowerCase().includes('siluri')).map((row) => String(field(row, '@cod01') ?? '').trim().toUpperCase()).filter(Boolean))), [data.mangimi]);
  const activeSiluriCode = selectedSiluriCode || availableSiluriCodes[0] || '';
  const siluriDenominationByCode = React.useMemo(() => new Map((data.mangimi ?? []).filter((row) => selectValue(field(row, '@cat01')).toLowerCase().includes('siluri')).map((row) => [String(field(row, '@cod01') ?? '').trim().toUpperCase(), String(field(row, '@den01') ?? '').trim()])), [data.mangimi]);
  const siluriBalances = React.useMemo(() => siluriBalanceByCode(data.siluri ?? [], data.statiSiluri ?? []), [data.siluri, data.statiSiluri]);
  const siluriTotalBalance = Object.values(siluriBalances).reduce((sum, quantity) => sum + quantity, 0);
  const availableSacconiCodes = React.useMemo(() => Array.from(new Set((data.mangimi ?? []).filter((row) => selectValue(field(row, '@cat01')).toLowerCase().includes('sacconi')).map((row) => String(field(row, '@cod01') ?? '').trim().toUpperCase()).filter(Boolean))), [data.mangimi]);
  const availableSacchiCodes = React.useMemo(() => Array.from(new Set((data.mangimi ?? []).filter((row) => selectValue(field(row, '@cat01')).toLowerCase().includes('sacchi')).map((row) => String(field(row, '@cod01') ?? '').trim().toUpperCase()).filter(Boolean))), [data.mangimi]);
  const cassePlateRecords = React.useMemo<PlateRecord[]>(() => (data.casse ?? []).map((row) => { const destination = String(field(row, '@cas09') ?? '').trim().toUpperCase(); return { id: row.id, plate: String(field(row, '@cas07') ?? '').trim().toUpperCase(), product: String(field(row, '@cas02') ?? field(row, '@cas01') ?? ''), date: String(field(row, '@cas04') ?? ''), lot: String(field(row, '@cas03') ?? ''), ddt: String(field(row, '@cas05') ?? ''), position: destination.includes('VUOT') ? 'VUOTA' : destination.includes('DEPOSIT') ? 'DEPOSITO CAGLIARI' : 'IN TRANSITO', note: String(field(row, '@cas10') ?? ''), cargoType: 'CASSE' }; }).filter((row) => row.plate && (row.product || row.ddt)), [data.casse]);
  const siluriPlateRecords = React.useMemo<PlateRecord[]>(() => (data.siluri ?? []).map((row) => { const plate = String(field(row, '@sil07') ?? '').trim().toUpperCase(); const statusRow = (data.statiSiluri ?? []).find((status) => String(field(status, '@sst01') ?? '').trim().toUpperCase() === plate || String(field(status, '@sst05') ?? '').trim() === row.id); const status = selectValue(field(statusRow, '@sst02')); return { id: row.id, plate, product: String(field(row, '@sil02') ?? field(row, '@sil01') ?? ''), date: String(field(row, '@sil04') ?? ''), lot: String(field(row, '@sil03') ?? ''), ddt: String(field(row, '@sil05') ?? ''), position: status === 'vuota' ? 'VUOTA' : status === 'deposito' ? 'DEPOSITO CAGLIARI' : 'IN TRANSITO', note: String(field(row, '@sil09') ?? field(row, '@sil08') ?? ''), cargoType: 'SILURI' }; }).filter((row) => row.plate), [data.siluri, data.statiSiluri]);
  const centinatiPlateRecords = React.useMemo<PlateRecord[]>(() => [
    ...(data.centinati ?? []).map((row) => ({ id: row.id, plate: String(field(row, '@cen01') ?? '').trim().toUpperCase(), product: String(field(row, '@cen02') ?? ''), date: String(field(row, '@cen03') ?? ''), lot: String(field(row, '@cen04') ?? ''), ddt: String(field(row, '@cen05') ?? ''), position: selectValue(field(row, '@cen06')).toUpperCase().replace('DEPOSITO', 'DEPOSITO CAGLIARI'), note: String(field(row, '@cen07') ?? ''), cargoType: 'CENTINATI' })),
    ...(data.sacconi ?? []).map((row) => ({ id: `sacconi-${row.id}`, plate: String(field(row, '@sac07') ?? '').trim().toUpperCase(), product: String(field(row, '@sac02') ?? field(row, '@sac01') ?? ''), date: String(field(row, '@sac04') ?? ''), lot: String(field(row, '@sac03') ?? ''), ddt: String(field(row, '@sac05') ?? ''), position: 'IN TRANSITO', note: String(field(row, '@sac09') ?? ''), cargoType: 'SACCONI' })),
    ...(data.sacchi ?? []).map((row) => ({ id: `sacchi-${row.id}`, plate: String(field(row, '@stk07') ?? '').trim().toUpperCase(), product: String(field(row, '@stk02') ?? field(row, '@stk01') ?? ''), date: String(field(row, '@stk04') ?? ''), lot: String(field(row, '@stk03') ?? ''), ddt: String(field(row, '@stk05') ?? ''), position: 'IN TRANSITO', note: String(field(row, '@stk10') ?? ''), cargoType: 'SACCHI' })),
  ].filter((row) => row.plate), [data.centinati, data.sacconi, data.sacchi]);
  const allPlateRecords = React.useMemo<PlateRecord[]>(() => [...cassePlateRecords, ...siluriPlateRecords, ...centinatiPlateRecords], [cassePlateRecords, siluriPlateRecords, centinatiPlateRecords]);

  const importCsv = async (file: File) => {
    if (!canManage || readOnly) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error('Il file non contiene righe importabili.');
    const headers = lines[0].split(/[;,\t]/).map((item) => item.trim().toLowerCase());
    const target = formCategory;
    const fieldMap: Record<string, string> = target === 'casse' ? { codice: '@cas01', denominazione: '@cas02', lotto: '@cas03', ddt: '@cas05', quantita: '@cas06', targa: '@cas07', cassa: '@cas08' } : target === 'siluri' ? { codice: '@sil01', denominazione: '@sil02', lotto: '@sil03', ddt: '@sil05', quantita: '@sil06', targa: '@sil07', cliente: '@sil08' } : target === 'sacconi' ? { codice: '@sac01', denominazione: '@sac02', lotto: '@sac03', ddt: '@sac05', quantita: '@sac06', targa: '@sac07', sacconi: '@sac08' } : { codice: '@stk01', denominazione: '@stk02', lotto: '@stk03', ddt: '@stk05', quantita: '@stk06', targa: '@stk07', sacchi: '@stk08', epal: '@stk09' };
    let imported = 0;
    for (const line of lines.slice(1)) {
      const values = line.split(/[;,\t]/).map((item) => item.trim());
      const payload: Record<string, unknown> = { '/text': values[headers.indexOf('denominazione')] || `${target} importato` };
      Object.entries(fieldMap).forEach(([header, fieldId]) => { const value = values[headers.indexOf(header)]; if (value !== undefined && value !== '') payload[`/attributes/${fieldId}`] = header === 'quantita' ? Number(value.replace(',', '.')) * 10 : ['cassa', 'sacconi', 'sacchi', 'epal'].includes(header) ? Number(value.replace(',', '.')) : value; });
      await createNode(PROJECTS[target], payload); imported += 1;
    }
    toast.success(`${imported} righe importate in ${target}.`); await load();
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || readOnly) {
      toast.error('Solo admin e staff autorizzati possono inserire movimenti.');
      return;
    }
    const config = formCategory === 'casse'
      ? { project: PROJECTS.casse, code: '@cas01', name: '@cas02', lot: '@cas03', date: '@cas04', ddt: '@cas05', qty: '@cas06', plate: '@cas07', count: '@cas08', destination: '@cas09', note: '@cas10', movement: '@cas11', available: '@cas12' }
      : formCategory === 'siluri'
        ? { project: PROJECTS.siluri, code: '@sil01', name: '@sil02', lot: '@sil03', date: '@sil04', ddt: '@sil05', qty: '@sil06', plate: '@sil07', client: '@sil08', note: '@sil09', movement: '@sil10', available: '@sil11' }
        : formCategory === 'sacconi'
          ? { project: PROJECTS.sacconi, code: '@sac01', name: '@sac02', lot: '@sac03', date: '@sac04', ddt: '@sac05', qty: '@sac06', plate: '@sac07', count: '@sac08', note: '@sac09', movement: '@sac10', available: '@sac11', client: '@sac12' }
          : { project: PROJECTS.sacchi, code: '@stk01', name: '@stk02', lot: '@stk03', date: '@stk04', ddt: '@stk05', qty: '@stk06', plate: '@stk07', count: '@stk08', epal: '@stk09', note: '@stk10', movement: '@stk11', available: '@stk12', client: '@stk13' };
    const isManualCassaDischarge = formCategory === 'casse' && form.movement === 'scarico';
    const reference = String(form.cassaReference ?? '').trim();
    const referenceCode = String(form.code ?? selectedCassaCode).trim();
    const referenceRow = isManualCassaDischarge
      ? (data.casse ?? []).filter((row) => String(field(row, '@cas01') ?? '').trim().toUpperCase() === referenceCode.toUpperCase() && String(field(row, '@cas08') ?? '').trim() === reference && selectValue(field(row, '@cas11')) === 'carico' && selectValue(field(row, '@cas12')) === 'si').sort((left, right) => String(field(right, '@cas04') ?? '').localeCompare(String(field(left, '@cas04') ?? '')))[0]
      : undefined;
    if (isManualCassaDischarge) {
      const balance = cassaBalance(data.casse ?? [], referenceCode, reference);
      const quantity = numeric(form.qty);
      const balanceTm = metricTons(balance);
      if (!reference || !referenceRow || balance <= 0.3) {
        toast.error('Puoi scaricare solo una cassa presente e disponibile in magazzino.');
        return;
      }
      if (quantity <= 0 || quantity > balanceTm + 0.0001) {
        toast.error(`La quantità supera la giacenza presente della cassa: ${balanceTm.toLocaleString('it-IT')} TM.`);
        return;
      }
    }
    const referenceValue = (fieldId: string) => String(field(referenceRow, fieldId) ?? '').trim();
    const cassaValue = isManualCassaDischarge ? reference : form.count;
    const siluriClient = String(form.code ?? '').trim().toUpperCase() === '1440IR' ? 'agristar-foddi' : 'agristar';
    const selectedProductCode = String(form.code ?? referenceCode).trim().toUpperCase();
    const archiveName = String(field((data.mangimi ?? []).find((row) => String(field(row, '@cod01') ?? '').trim().toUpperCase() === selectedProductCode), '@den01') ?? '').trim();
    const productName = archiveName || String(form.name ?? '').trim();
    const payload: Record<string, unknown> = {
      '/text': isManualCassaDischarge ? `Scarico cassa ${reference}` : (productName || (form.movement === 'scarico' ? 'Nuovo scarico' : 'Nuovo carico')),
      [`/attributes/${config.code}`]: isManualCassaDischarge ? referenceValue('@cas01') : form.code,
      [`/attributes/${config.name}`]: isManualCassaDischarge ? referenceValue('@cas02') : productName,
      [`/attributes/${config.lot}`]: isManualCassaDischarge ? referenceValue('@cas03') : form.lot,
      [`/attributes/${config.date}`]: dateInputToRomeIso(form.date),
      [`/attributes/${config.ddt}`]: form.ddt,
      [`/attributes/${config.qty}`]: Number(form.qty || 0) * 10,
      [`/attributes/${config.plate}`]: isManualCassaDischarge ? referenceValue('@cas07') : form.plate,
      [`/attributes/${config.movement}`]: formCategory === 'siluri' ? 'carico' : (form.movement === 'scarico' ? 'scarico' : 'carico'),
      [`/attributes/${config.available}`]: formCategory === 'siluri' ? 'si' : (form.available === 'no' ? 'no' : 'si'),
      [`/attributes/${config.note}`]: form.note,
    };
    if ('count' in config && config.count) payload[`/attributes/${config.count}`] = formCategory === 'casse' ? cassaValue : Number(form.count || 0);
    if ('epal' in config && config.epal) payload[`/attributes/${config.epal}`] = Number(form.epal || 0);
    if ('client' in config && config.client) payload[`/attributes/${config.client}`] = formCategory === 'siluri' ? siluriClient : (form.movement === 'scarico' ? form.client : CASSA_DEPOSITO_CLIENT);
    if ('destination' in config && config.destination) payload[`/attributes/${config.destination}`] = isManualCassaDischarge ? form.client : formCategory === 'casse' ? CASSA_DEPOSITO_CLIENT : (form.destination || 'Deposito TRANS ISOLE (CA)');
    Object.keys(payload).forEach((key) => { if (payload[key] === undefined || payload[key] === '') delete payload[key]; });
    try {
      await createNode(config.project, payload);
      if (formCategory === 'casse') {
        const plate = String(form.plate ?? '').trim().toUpperCase();
        if (plate) {
          const targaValues = { '/text': plate, '/attributes/@bil01': plate, '/attributes/@bil07': String(form.code ?? '').trim().toUpperCase(), '/attributes/@bil08': dateInputToRomeIso(form.date), '/attributes/@bil10': String(form.ddt ?? '').trim(), '/attributes/@bil11': 'IN TRANSITO', '/attributes/@bil13': String(form.note ?? '').trim() || 'Aggiornata dal nuovo DDT casse' };
          const existingTarga = (data.bilici ?? []).find((row) => String(field(row, '@bil01') ?? '').trim().toUpperCase() === plate);
          if (existingTarga) await updateNode(PROJECTS.bilici, existingTarga.id, targaValues);
          else await createNode(PROJECTS.bilici, targaValues);
        }
      }
      if (formCategory === 'siluri') {
        const plate = String(form.plate ?? '').trim().toUpperCase();
        const clientLabel = siluriClient === 'agristar-foddi' ? 'AGRISTAR/FODDI' : 'AGRISTAR';
        if (plate) {
          const timestamp = new Date().toISOString();
          await createNode(PROJECTS.statiSiluri, { '/text': `Targa ${plate} - ${clientLabel}`, '/attributes/@sst01': plate, '/attributes/@sst02': 'transito', '/attributes/@sst03': clientLabel, '/attributes/@sst04': timestamp, '/attributes/@sst06': timestamp });
        }
      }
      toast.success(formCategory === 'siluri' ? 'Nuovo carico siluro registrato in transito.' : (form.movement === 'scarico' ? 'Scarico registrato nella cassa selezionata.' : 'Nuovo carico registrato.'));
      setForm({}); setShowForm(false); await load();
    } catch { toast.error(formCategory === 'siluri' ? 'Il carico del siluro non è stato registrato. Controlla i campi.' : (form.movement === 'scarico' ? 'Lo scarico non è stato registrato. Controlla i campi.' : 'Il carico non è stato registrato. Controlla i campi.')); }
  };

  const cassaCodeHasLoad = (code: string) => (data.casse ?? []).some((row) => String(field(row, '@cas01') ?? '').trim().toUpperCase() === code.toUpperCase() && (selectValue(field(row, '@cas11')) === 'carico' || !String(field(row, '@cas11') ?? '').trim()));
  const renderCategory = (category: Category) => <Card dataMagazzinoTab={category} className="neon-panel"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{category.toUpperCase()}</p><h2 className="mt-1 text-xl font-semibold">{category === 'casse' ? 'GESTIONE OPERATIVA CASSE' : 'Carichi e scarichi registrati'}</h2></div></div>{category === 'casse' && <div className="mb-5 rounded-2xl border border-primary/25 bg-background/45 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Codice mangime</p><p className="mt-1 text-sm text-muted-foreground">Seleziona il codice per vedere le sue casse, carichi e scarichi.</p></div><span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{availableCassaCodes.length} codici</span></div><div className="mt-4 space-y-2">{availableCassaCodes.map((code) => { const hasLoad = cassaCodeHasLoad(code); const availableCasseForCode = Array.from(new Set((data.casse ?? []).filter((row) => String(field(row, '@cas01') ?? '').trim().toUpperCase() === code.toUpperCase()).map((row) => String(field(row, '@cas08') ?? '').trim()).filter(Boolean))).filter((cassa) => cassaBalance(data.casse ?? [], code, cassa) > 0.3); return <div key={code} className={`flex flex-wrap items-center gap-2 rounded-xl border p-2 ${selectedCassaCode === code ? 'border-primary/70 bg-primary/10' : 'border-border/70 bg-card/60'}`}><button type="button" onClick={() => { setSelectedCassaCode(code); setShowNewCassaCode(false); }} style={{ color: feedColorForCode(code), borderColor: feedColorForCode(code), backgroundColor: selectedCassaCode === code ? `${feedColorForCode(code)}22` : undefined }} className={`min-h-11 rounded-lg border px-4 text-sm font-bold transition ${selectedCassaCode === code ? 'shadow-[0_0_14px_hsl(var(--primary)/0.18)]' : 'bg-card hover:bg-accent'}`}><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: feedColorForCode(code) }} />{code}</button>{canManage && !readOnly && <><button type="button" onClick={() => { setSelectedCassaCode(code); setFormCategory('casse'); setForm({ movement: 'carico', available: 'no', code, destination: CASSA_DEPOSITO_CLIENT }); setShowForm(true); }} className="min-h-11 rounded-lg border border-emerald-400/50 px-3 text-sm font-semibold text-emerald-500 hover:bg-emerald-500/10">+ Inserisci carico manualmente</button><button type="button" disabled={!hasLoad || availableCasseForCode.length === 0} onClick={() => { if (availableCasseForCode.length === 0) return; setSelectedCassaCode(code); setFormCategory('casse'); setForm({ movement: 'scarico', available: 'no', code, cassaReference: availableCasseForCode[0] }); setShowForm(true); }} className="min-h-11 rounded-lg border border-orange-400/50 px-3 text-sm font-semibold text-orange-500 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-40">+ Inserisci scarico manualmente</button></>}<span className="ml-auto px-2 text-xs text-muted-foreground">{hasLoad ? 'Carico presente' : 'Nessun carico'}</span></div>})}{canManage && !readOnly && <button type="button" onClick={() => setShowNewCassaCode((value) => !value)} className="min-h-11 rounded-xl border border-dashed border-primary/60 px-4 text-sm font-semibold text-primary hover:bg-primary/10">+ Nuovo codice</button>}</div>{showNewCassaCode && canManage && !readOnly && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><label className="min-w-0 flex-1 space-y-2 text-sm font-semibold"><span>Nuovo codice mangime</span><input value={newCassaCode} onChange={(event) => setNewCassaCode(event.target.value.toUpperCase())} placeholder="Es. 1047SCPAF" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label><button type="button" disabled={!newCassaCode.trim()} onClick={() => { const code = newCassaCode.trim().toUpperCase(); setSelectedCassaCode(code); setNewCassaCode(''); setShowNewCassaCode(false); }} className="min-h-11 self-end rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Seleziona codice</button></div>}</div>}{category === 'casse' ? <CasseMatrix rows={data.casse ?? []} mangimiRows={data.mangimi ?? []} selectedCode={selectedCassaCode} plateOptions={plateOptions} editable={canManage && !readOnly} onRefresh={load} onAddDischarge={(cassaReference) => { setFormCategory('casse'); setForm({ movement: 'scarico', available: 'no', code: selectedCassaCode, cassaReference }); setShowForm(true); }} /> : category === 'siluri' ? <><div className="mb-5 rounded-2xl border border-cyan-400/25 bg-background/45 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">Archivio codici SILURI</p><p className="mt-1 text-sm text-muted-foreground">Seleziona il codice per visualizzare i siluri e registrare un nuovo carico.</p></div><span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-500">{availableSiluriCodes.length} codici</span></div><div className="mt-4 flex flex-wrap gap-2">{availableSiluriCodes.map((code) => <button key={code} type="button" onClick={() => setSelectedSiluriCode(code)} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold transition ${activeSiluriCode === code ? 'border-cyan-400 bg-cyan-400/15 text-cyan-500 shadow-[0_0_16px_rgba(34,211,238,0.2)]' : 'border-border bg-card hover:bg-accent'}`}>{code}</button>)}{canManage && !readOnly && <button type="button" disabled={!activeSiluriCode} onClick={() => { setFormCategory('siluri'); setForm({ movement: 'carico', available: 'si', code: activeSiluriCode, client: activeSiluriCode === '1440IR' ? 'agristar-foddi' : 'agristar' }); setShowForm(true); }} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">+ Inserisci carico siluro</button>}</div></div><div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.7fr)]"><div className="rounded-2xl border border-cyan-400/25 bg-background/45 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">Giacenza per codice</p><p className="mt-1 text-sm text-muted-foreground">Include transito, porto e dal cliente. SVUOTATA sottrae il quantitativo.</p></div><span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-500">{availableSiluriCodes.length} codici</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{availableSiluriCodes.map((code) => <div key={code} style={{ borderColor: productColorForCode(code), backgroundColor: `${productColorForCode(code)}22` }} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"><div className="min-w-0"><p className="font-mono text-sm font-bold" style={{ color: productColorForCode(code) }}>{code}</p><p className="truncate text-xs text-muted-foreground">{siluriDenominationByCode.get(code) || 'Denominazione non indicata'}</p></div><span className="shrink-0 text-sm font-bold tabular-nums">{formatMetricTons(siluriBalances[code] ?? 0)} TM</span></div>)}</div></div><div className="flex flex-col justify-between rounded-2xl border border-emerald-400/35 bg-emerald-400/10 p-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">Giacenza totale SILURI</p><p className="mt-2 text-3xl font-bold tabular-nums text-emerald-500">{formatMetricTons(siluriTotalBalance)} TM</p></div><p className="mt-3 text-xs text-muted-foreground">Saldo netto di tutti i codici presenti.</p></div></div><SiluriConsumptionTable rows={data.consumiSiluri ?? []} editable={canManage && !readOnly} onRefresh={load} /><SiluriMatrix rows={data.siluri ?? []} statusRows={data.statiSiluri ?? []} consumptionRows={data.consumiSiluri ?? []} currentBalance={siluriBalances[activeSiluriCode] ?? 0} selectedCode={activeSiluriCode} productName={siluriDenominationByCode.get(activeSiluriCode) ?? ''} editable={canManage && !readOnly} onRefresh={load} /></> : category === 'sacconi' ? <><SackCodePanel kind="sacconi" codes={availableSacconiCodes} rows={data.sacconi ?? []} mangimiRows={data.mangimi ?? []} selectedCode={selectedSacconiCode || availableSacconiCodes[0] || ''} onSelect={setSelectedSacconiCode} editable={canManage && !readOnly} onRefresh={load} onLoad={(code) => { setFormCategory('sacconi'); setForm({ movement: 'carico', available: 'si', code, destination: CASSA_DEPOSITO_CLIENT }); setShowForm(true); }} onDischarge={(code) => { setFormCategory('sacconi'); setForm({ movement: 'scarico', available: 'no', code }); setShowForm(true); }} /><SacconiMatrix rows={data.sacconi ?? []} mangimiRows={data.mangimi ?? []} kind="sacconi" selectedCode={selectedSacconiCode || availableSacconiCodes[0]} editable={canManage && !readOnly} onRefresh={load} onAddDischarge={(reference) => { setFormCategory('sacconi'); setForm({ movement: 'scarico', available: 'no', code: selectedSacconiCode || availableSacconiCodes[0], count: reference }); setShowForm(true); }} /></> : category === 'sacchi' ? <><SackCodePanel kind="sacchi" codes={availableSacchiCodes} rows={data.sacchi ?? []} mangimiRows={data.mangimi ?? []} selectedCode={selectedSacchiCode || availableSacchiCodes[0] || ''} onSelect={setSelectedSacchiCode} editable={canManage && !readOnly} onRefresh={load} onLoad={(code) => { setFormCategory('sacchi'); setForm({ movement: 'carico', available: 'si', code, destination: CASSA_DEPOSITO_CLIENT }); setShowForm(true); }} onDischarge={(code) => { setFormCategory('sacchi'); setForm({ movement: 'scarico', available: 'no', code }); setShowForm(true); }} /><SacchiMatrix rows={data.sacchi ?? []} mangimiRows={data.mangimi ?? []} kind="sacchi" selectedCode={selectedSacchiCode || availableSacchiCodes[0]} editable={canManage && !readOnly} onRefresh={load} onAddDischarge={(reference) => { setFormCategory('sacchi'); setForm({ movement: 'scarico', available: 'no', code: selectedSacchiCode || availableSacchiCodes[0], count: reference }); setShowForm(true); }} /></> : <DataTable rows={data[category] ?? []} category={category} editable={canManage && !readOnly} onRefresh={load} />}<DdtImportNotice />{category === 'casse' && <><p className="mt-4 rounded-xl border border-orange-400/30 bg-orange-400/10 p-3 text-sm text-orange-500">Lo scarico cliente si registra manualmente dalla tabella della cassa.</p><div className="mt-6"><BolleCaricoPanel rows={data.bolleCarico ?? []} kind="casse" editable={canManage && !readOnly} onRefresh={load} /></div></>}{category === 'siluri' && <div className="mt-6"><BolleCaricoPanel rows={data.bolleCaricoSiluri ?? []} kind="siluri" editable={canManage && !readOnly} onRefresh={load} /></div>}{category === 'sacconi' && <div className="mt-6"><BolleCaricoPanel rows={data.bolleCaricoSacconi ?? []} kind="sacconi" editable={canManage && !readOnly} onRefresh={load} /></div>}{category === 'sacchi' && <div className="mt-6"><BolleCaricoPanel rows={data.bolleCaricoSacchi ?? []} kind="sacchi" editable={canManage && !readOnly} onRefresh={load} /></div>}</Card>;
  const primaryNav: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'QUADRO GENERALE', icon: Sparkles },
    ...categories.map((item) => ({ id: item.id, label: item.label, icon: item.icon })),
  ];
  const secondaryNav: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: 'ricercaTarga', label: 'RICERCA TARGA', icon: TargaSearchIcon },
    { id: 'statiCasse', label: 'TARGHE CASSE', icon: CasseCategoryIcon },
    { id: 'statiSiluri', label: 'TARGHE SILURI', icon: SiluriCategoryIcon },
    { id: 'statiCentinati', label: 'TARGHE CENTINATI', icon: TargaSearchIcon },
    ...(canAccessEpal ? [{ id: 'epal' as Tab, label: 'CONTABILITÀ EPAL', icon: EpalCategoryIcon }] : []),
    { id: 'mangimi', label: 'ARCHIVIO CODICI MANGIMI', icon: FileText },
    { id: 'fileGiacenze', label: 'SCARICA FILE GIACENZE PRODOTTI', icon: ArrowDownToLine },
    { id: 'scarichi', label: 'PROGRAMMAZIONE CARICHI', icon: CalendarDays },
    { id: 'impostazioni', label: 'IMPOSTAZIONI', icon: Settings2 },
    ...(canAccessAdmin ? [{ id: 'registro' as Tab, label: 'REGISTRO ATTIVITÀ', icon: FileText }, { id: 'report' as Tab, label: 'REPORT', icon: ArrowDownToLine }] : []),
    ...(canAccessAdmin ? [{ id: 'sicurezza' as Tab, label: 'SICUREZZA', icon: LockKeyhole }] : []),
    ...(canAccessAdmin ? [{ id: 'admin' as Tab, label: 'ADMIN', icon: LockKeyhole }] : []),
  ];
  const navItems = [...primaryNav, ...secondaryNav];
  const allowedTab = navItems.some((item) => item.id === activeTab);
  React.useEffect(() => {
    if (!allowedTab) setActiveTab(navItems[0]?.id ?? 'bilici');
  }, [allowedTab, navItems]);
  const scrollToActiveSection = React.useCallback((tab: Tab) => {
    let firstFrame = 0;
    let secondFrame = 0;
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const target = document.querySelector(`[data-magazzino-tab="${tab}"]`) ?? document.getElementById('magazzino-main');
        if (!target) return;
        const stickyHeaderBottom = Math.max(0, document.getElementById('magazzino-sticky-header')?.getBoundingClientRect().bottom ?? 0);
        (target as HTMLElement).style.scrollMarginTop = `${stickyHeaderBottom + 12}px`;
        target.scrollIntoView({ block: 'start', behavior: 'auto' });
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, []);
  const navigateToTab = React.useCallback((tab: Tab) => {
    setMobileNavCollapsed(false);
    setActiveTab(tab);
    scrollToActiveSection(tab);
  }, [scrollToActiveSection]);

  if (auth.isLoading) return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="w-full max-w-md space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-muted" /><div className="h-24 animate-pulse rounded-2xl bg-muted" /><div className="h-24 animate-pulse rounded-2xl bg-muted" /></div></div>;
  if (!auth.isAuthenticated && !isPreviewHost) return <div className="flex min-h-screen items-center justify-center bg-background p-6"><Card className="w-full max-w-md text-center"><Truck className="mx-auto text-primary" size={32} /><h1 className="mt-4 text-2xl font-semibold">Gestionale SARDEGNA</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Accedi al gestionale con il tuo account Google oppure con il tuo indirizzo email. La registrazione resta in attesa di approvazione.</p><div className="mt-6 grid gap-3"><button onClick={() => void auth.signinRedirect({ extraQueryParams: { ui_locales: 'it', login_hint: currentEmail } })} className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 shadow-sm"><span aria-hidden="true" className="bg-[conic-gradient(from_-45deg,#4285F4_0deg_90deg,#34A853_90deg_180deg,#FBBC05_180deg_270deg,#EA4335_270deg_360deg)] bg-clip-text text-lg font-black text-transparent">G</span>Continua con Google</button><button onClick={() => void auth.signinRedirect({ extraQueryParams: { ui_locales: 'it' } })} className="min-h-11 w-full rounded-xl border border-border px-4 py-3 font-semibold hover:bg-accent">Accedi con email</button></div><p className="mt-4 text-xs text-muted-foreground">La pagina sicura di accesso completa la scelta del metodo e della lingua.</p></Card></div>;
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="w-full max-w-md space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-muted" /><div className="h-24 animate-pulse rounded-2xl bg-muted" /><div className="h-24 animate-pulse rounded-2xl bg-muted" /></div></div>;
  if (!isApproved && !matchingUser) return <PendingRegistrationCard email={currentEmail} onSubmitted={load} />;
  if (!isApproved) return <div className="flex min-h-screen items-center justify-center bg-background p-6"><Card className="w-full max-w-md text-center"><LockKeyhole className="mx-auto text-primary" size={32} /><h1 className="mt-4 text-2xl font-semibold">Accesso in attesa</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Il titolare deve approvare l’indirizzo {currentEmail || 'del tuo account'} nel registro utenti autorizzati.</p><button onClick={() => void auth.signoutRedirect()} className="mt-6 w-full rounded-xl border border-border px-4 py-3 font-semibold hover:bg-accent">Esci</button></Card></div>;

  return <div className="min-h-screen bg-background text-foreground"><header id="magazzino-sticky-header" className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur"><div data-active-section={activeTab} className={`magazzino-header-inner relative mx-auto grid w-full max-w-7xl grid-cols-2 items-center gap-2 px-3 py-3 sm:flex sm:flex-col sm:justify-center sm:gap-2 sm:px-6 ${activeTab === 'overview' ? 'sm:min-h-[18rem]' : 'sm:min-h-0'}`}><div className="magazzino-header-account col-span-1 row-start-1 flex min-w-0 flex-wrap items-center justify-start gap-1.5 sm:absolute sm:left-6 sm:top-6 sm:max-w-[calc(100%_-_2rem)] sm:gap-2"><div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card/85 px-3 py-2"><UserCircle size={18} className="shrink-0 text-primary" /><div className="min-w-0"><p className="max-w-[9rem] truncate text-xs font-bold sm:max-w-[14rem]">{userDisplayName} ({userRoleLabel[effectiveRole] ?? 'UTENTE'})</p><p className="max-w-[9rem] truncate text-[10px] text-muted-foreground sm:max-w-[14rem]">{currentEmail}</p></div></div>{actualIsAdmin && isApproved && <label className="min-w-0"><span className="sr-only">Visualizza l’app come</span><select aria-label="Visualizza l’app come" value={viewAsRole ?? ''} onChange={(event) => setViewAsRole(event.target.value || null)} className="min-h-11 max-w-[10rem] rounded-xl border border-border bg-card/85 px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Vista Admin</option>{previewRoleOptions.map((role) => <option key={role} value={role}>{userRoleLabel[role]}</option>)}</select></label>}{isRolePreview && <span className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">Sola lettura</span>}<button type="button" onClick={() => void auth.signoutRedirect()} aria-label="Esci dal gestionale" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card/85 p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"><LogOut size={18} /></button></div><div className="magazzino-header-brand col-span-2 row-start-2 flex min-w-0 flex-col items-center text-center"><img src="https://files.taskade.com/space-files/b8c1f181-5dc9-4f9e-a1cd-2aa8d2b3f2fb/original/LOGO%20FINAL.png" alt="Logo del gestionale" className={`neon-logo w-full object-contain object-center ${activeTab === 'overview' ? 'h-24 max-w-[24rem] sm:h-40 sm:max-w-[36rem]' : 'h-8 max-w-[9rem] sm:h-10 sm:max-w-[12rem]'}`} /><h1 className={`font-bold uppercase tracking-[0.14em] text-foreground ${activeTab === 'overview' ? 'mt-2 text-2xl sm:text-4xl' : 'mt-0 text-xs sm:text-sm'}`}>Gestionale SARDEGNA</h1></div><div className="magazzino-header-controls col-span-1 row-start-1 flex min-w-0 items-center justify-end gap-1.5 sm:absolute sm:right-6 sm:top-6 sm:max-w-[calc(100%_-_2rem)] sm:flex-wrap sm:gap-2"><button type="button" onClick={() => void load()} aria-label="Aggiorna dati adesso" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card/85 p-2"><RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /></button><button type="button" onClick={() => setLiveRefresh((value) => !value)} className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold ${liveRefresh ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300' : 'border-border bg-card/85 text-muted-foreground'}`}>{liveRefresh ? 'Aggiornamento live attivo' : 'Aggiornamento live disattivato'}{lastRefreshAt ? ` · ${lastRefreshAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : ''}</button></div><button type="button" className="magazzino-header-toggle col-span-2 row-start-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden" aria-expanded={!mobileNavCollapsed} aria-controls="magazzino-section-menu" onClick={() => setMobileNavCollapsed((collapsed) => !collapsed)}><span>{mobileNavCollapsed ? 'Mostra il menù' : 'Riduci il menù'}</span><ChevronDown size={18} aria-hidden="true" className={`transition-transform duration-200 ${mobileNavCollapsed ? 'rotate-180' : ''}`} /></button><nav id="magazzino-section-menu" data-collapsed={mobileNavCollapsed} className="magazzino-header-nav col-span-2 row-start-4 w-full min-w-0 max-w-7xl px-0 sm:px-4" aria-label="Sezioni magazzino"><div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:flex lg:flex-wrap lg:justify-center">{navItems.map((item) => <button key={item.id} type="button" onClick={() => navigateToTab(item.id)} aria-current={activeTab === item.id ? 'page' : undefined} className={activeTab === item.id ? 'flex min-h-10 min-w-0 w-full items-center justify-center gap-1 rounded-lg bg-primary px-1.5 py-1.5 text-[9px] font-semibold leading-tight text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.3)] sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-2 sm:py-2 sm:text-[11px] lg:w-auto lg:px-3 lg:text-xs' : 'flex min-h-10 min-w-0 w-full items-center justify-center gap-1 rounded-lg border border-border bg-card px-1.5 py-1.5 text-[9px] font-semibold leading-tight hover:bg-accent sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-2 sm:py-2 sm:text-[11px] lg:w-auto lg:px-3 lg:text-xs'}><item.icon size={18} strokeWidth={1.8} className="shrink-0" /><span className="min-w-0 whitespace-normal break-words text-center">{item.label}</span></button>)}</div></nav></div></header><main id="magazzino-main" className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">{isRolePreview && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-sm"><p className="font-semibold text-amber-800 dark:text-amber-200">Anteprima {userRoleLabel[effectiveRole] ?? 'utente'} in sola lettura. Nessun dato verrà modificato.</p><button type="button" onClick={() => setViewAsRole(null)} className="min-h-11 rounded-lg border border-amber-500/40 px-3 font-semibold text-amber-800 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-amber-200">Torna alla vista Admin</button></div>}<div className="grid grid-cols-1 gap-3 lg:grid-cols-2" hidden={activeTab !== 'overview'}><div className="min-w-0"><SiluriStockOverviewWidget rows={data.siluri ?? []} statusRows={data.statiSiluri ?? []} mangimiRows={data.mangimi ?? []} consumptionRows={data.consumiSiluri ?? []} editable={canManage && !readOnly} onRefresh={load} /></div><div className="min-w-0"><FeedStockDonutWidget rows={data.casse ?? []} mangimiRows={data.mangimi ?? []} editable={canManage && !readOnly} onRefresh={load} /></div></div>{activeTab === 'overview' && <DischargeProgramPanel rows={data.scarichi ?? []} mangimiRows={data.mangimi ?? []} editable={canManage && !readOnly} onRefresh={load} />}<div className="grid grid-cols-1 gap-3 lg:grid-cols-2" hidden={activeTab !== 'overview'}><LastSiluroLoadWidget rows={data.siluri ?? []} /><LastCassaDischargeWidget rows={data.casse ?? []} /></div>{activeTab === 'overview' && canSeeEpalWidget && <div className="mt-3"><Card className="border-cyan-400/35 bg-cyan-400/10"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-3xl font-black uppercase tracking-[0.16em] text-cyan-500 dark:text-cyan-300">EPAL</p><p className="mt-2 text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">In arrivo prossimamente</p></div><EpalCategoryIcon size={34} className="text-cyan-500" /></div></Card></div>}{false && <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]"><Card><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mappa operativa</p><h2 className="mt-1 text-2xl font-semibold">Dove si trova il mangime</h2></div><Warehouse className="text-primary" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{categories.map((item) => <button key={item.id} onClick={() => setActiveTab(item.id)} className="group rounded-2xl border border-border/70 bg-background/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50"><div className="flex items-center justify-between"><span className="rounded-xl bg-accent p-2 text-primary"><item.icon size={19} /></span><ChevronRight size={18} className="text-muted-foreground transition group-hover:translate-x-1" /></div><p className="mt-4 font-semibold">{item.label}</p><p className="mt-1 text-sm text-muted-foreground">{item.short} · {data[item.id]?.length ?? 0} carichi</p></button>)}</div></Card><Card><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Accesso operativo</p><h2 className="mt-1 text-xl font-semibold">Controllo titolare</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">La consultazione è impostata in sola lettura. La gestione dati va attivata solo dal titolare.</p>{isOwner && <button onClick={() => setReadOnly((value) => !value)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-accent"><LockKeyhole size={16} />{readOnly ? 'Attiva gestione titolare' : 'Torna in sola lettura'}</button>}</Card></div>}{(['casse', 'siluri', 'sacconi', 'sacchi'] as Category[]).includes(activeTab as Category) && renderCategory(activeTab as Category)}{activeTab === 'mangimi' && <MangimiArchivePanel rows={data.mangimi ?? []} editable={canManage && !readOnly} onRefresh={load} />}{activeTab === 'fileGiacenze' && <StockExportsPanel data={data} />}{activeTab === 'bilici' && <div className="space-y-6"><BiliciPanel rows={data.bilici ?? []} requesterEmail={currentEmail} editable={canManage && !readOnly} canViewAll={isAdmin} onRefresh={load} /></div>}{activeTab === 'ricercaTarga' && <TargheSearchPanel title="RICERCA TARGA" description="Cerca una targa in tutti i carichi registrati e seleziona la tipologia: CASSE, SILURI, SACCHI o SACCONI." records={allPlateRecords} showCargoTypeFilter />}{activeTab === 'statiCasse' && <TargheOperationsPanel kind="casse" loadRows={data.casse ?? []} statusRows={data.statiCasse ?? []} editable={canManage && !readOnly} onRefresh={load} />}{activeTab === 'statiSiluri' && <TargheOperationsPanel kind="siluri" loadRows={data.siluri ?? []} statusRows={data.statiSiluri ?? []} editable={canManage && !readOnly} onRefresh={load} />}{activeTab === 'statiCentinati' && <TargheListPanel title="TARGHE CENTINATI" description="Elenco dei carichi relativi a sacchi e sacconi, organizzati come centinati." records={centinatiPlateRecords} accentClass="text-violet-500" />}{activeTab === 'impostazioni' && <SettingsPanel currentEmail={currentEmail} currentName={userDisplayName} userRole={effectiveRole} isAdmin={isAdmin} editable={canManage && !readOnly} settingsRows={data.impostazioni ?? []} backupRows={data.ripristini ?? []} inventory={{ casse: data.casse ?? [], siluri: data.siluri ?? [], sacconi: data.sacconi ?? [], sacchi: data.sacchi ?? [] }} onRefresh={load} onSaveName={async (nextName) => { if (!matchingUser) throw new Error('Il profilo utente non è disponibile.'); await updateNode(PROJECTS.utenti, matchingUser.id, { '/text': `${currentEmail} - ${nextName}`, '/attributes/@usr02': nextName }); await load(); }} />}{activeTab === 'registro' && canAccessAdmin && <AdminOperationsPanel view="activity" data={data} isAdmin={isAdmin} canExport={false} staffExportAllowed={staffExportAllowed} onSetStaffExport={saveStaffExport} exportSaving={false} />}{activeTab === 'report' && canAccessAdmin && <AdminOperationsPanel view="reports" data={data} isAdmin={isAdmin} canExport={allowedForExport(userRole, staffExportAllowed)} staffExportAllowed={staffExportAllowed} onSetStaffExport={saveStaffExport} exportSaving={false} />}{activeTab === 'sicurezza' && canAccessAdmin && <AdminOperationsPanel view="security" data={data} isAdmin={isAdmin} canExport={false} staffExportAllowed={staffExportAllowed} onSetStaffExport={saveStaffExport} exportSaving={false} />}{activeTab === 'admin' && canAccessAdmin && <div className="space-y-6"><AdminUsersConsole rows={data.utenti ?? []} isAdmin={isAdmin} onRefresh={load} /><Card><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Audit retro</p><h2 className="mt-1 text-xl font-semibold">Accessi e attività</h2></div><div className="w-full overflow-hidden"><table className="mobile-stack-table w-full text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Data e ora</th><th className="px-3 py-3">Account</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Origine</th></tr></thead><tbody>{(data.accessi ?? []).slice().reverse().map((row) => <tr key={row.id} className="border-b border-border/60"><td data-label="DATA E ORA" className="px-3 py-3 tabular-nums">{String(field(row, '@acc03') ?? '').replace('T', ' ').replace('Z', '')}</td><td data-label="ACCOUNT" className="px-3 py-3">{String(field(row, '@acc01') ?? '')}</td><td data-label="TIPO" className="px-3 py-3">{selectValue(field(row, '@acc04'))}</td><td data-label="ORIGINE" className="px-3 py-3 text-muted-foreground">{String(field(row, '@acc05') ?? '')}</td></tr>)}</tbody></table></div>{(data.accessi ?? []).length === 0 && <p className="mt-3 rounded-xl bg-accent/60 p-4 text-sm text-muted-foreground">Gli accessi compariranno qui dopo il primo login pubblicato.</p>}</Card></div>}{false && <Card><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rientri e spedizioni</p><h2 className="text-xl font-semibold">Contabilità EPAL</h2></div><Boxes className="text-orange-500" /></div><div className="grid gap-3 sm:grid-cols-3"><Metric label="Spedite" value={sentEpal.toLocaleString('it-IT')} detail="Totale storico" accent="text-orange-500" /><Metric label="Rientrate" value={returnedEpal.toLocaleString('it-IT')} detail="Totale storico" accent="text-emerald-500" /><Metric label="Fuori" value={Math.max(sentEpal - returnedEpal, 0).toLocaleString('it-IT')} detail="Saldo da rientrare" accent="text-primary" /></div><div className="mt-6 overflow-hidden"><table className="mobile-stack-table w-full text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Data</th><th className="px-3 py-3">DDT</th><th className="px-3 py-3">Movimento</th><th className="px-3 py-3">EPAL</th></tr></thead><tbody>{(data.epal ?? []).map((row) => <tr key={row.id} className="border-b border-border/60"><td data-label="DATA" className="px-3 py-3">{String(field(row, '@epa01') ?? '')}</td><td data-label="DDT" className="px-3 py-3">{String(field(row, '@epa02') ?? '')}</td><td data-label="MOVIMENTO" className="px-3 py-3">{selectValue(field(row, '@epa03')) === 'spedita' ? 'Spedita' : 'Rientrata'}</td><td data-label="EPAL" className="px-3 py-3 font-semibold tabular-nums">{numeric(field(row, '@epa04'))}</td></tr>)}</tbody></table></div></Card>}{activeTab === 'epal' && canAccessEpal && <EpalAccountingPanel rows={data.epal ?? []} editable={canManage && !readOnly} onRefresh={load} />}{activeTab === 'scarichi' && <DischargeProgramPanel rows={data.scarichi ?? []} mangimiRows={data.mangimi ?? []} editable={canManage && !readOnly} onRefresh={load} />}</main><GaltieriFooter />{showForm && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><form onSubmit={submitForm} className="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Gestione admin e staff</p><h2 className="mt-1 text-xl font-semibold">{form.movement === 'scarico' ? 'Nuovo scarico' : 'Nuovo carico'} {formCategory}</h2></div><button type="button" onClick={() => setShowForm(false)} className="min-h-11 min-w-11 rounded-xl border border-border text-xl">×</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{(formCategory === 'casse' && form.movement === 'scarico' ? [['client','Cliente'],['date','Data scarico'],['ddt','Numero DDT'],['qty','Quantità TM']] : [['code','Codice'],...(form.movement === 'scarico' || formCategory === 'casse' || formCategory === 'siluri' ? [] : [['name','Denominazione']]),['lot','Lotto'],['date',form.movement === 'scarico' ? 'Data scarico' : 'Data carico'],['ddt','Numero DDT'],['qty','Quantità TM'],['plate','Targa'],...(form.movement === 'scarico' && (formCategory === 'sacconi' || formCategory === 'sacchi') ? [['client','Cliente']] : [])]).map(([key,label]) => <label key={key} className="space-y-2 text-sm font-semibold"><span>{label}</span>{key === 'plate' && formCategory === 'casse' ? <><input required list="form-casse-targhe-options" value={form[key] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value.toUpperCase() }))} placeholder="Inserisci o seleziona la targa" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none ring-offset-background focus:ring-2 focus:ring-ring" /><datalist id="form-casse-targhe-options">{plateOptions.map((plate) => <option key={plate} value={plate} />)}</datalist></> : <input required type={key === 'date' ? 'date' : key === 'qty' ? 'number' : 'text'} value={form[key] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none ring-offset-background focus:ring-2 focus:ring-ring" />}</label>)}{formCategory === 'casse' && form.movement === 'scarico' && <div className="rounded-xl border border-orange-400/35 bg-orange-400/10 p-3 text-sm sm:col-span-2"><p className="font-semibold">Dati cassa compilati automaticamente</p><p className="mt-1 text-muted-foreground">Cassa {form.cassaReference || 'selezionata'} · codice prodotto e lotto verranno associati alla cassa scelta.</p></div>}{formCategory !== 'siluri' && !(formCategory === 'casse' && form.movement === 'scarico') && <label className="space-y-2 text-sm font-semibold"><span>{formCategory === 'casse' ? 'CASSA' : formCategory === 'sacconi' ? 'N. Sacconi' : 'N. Sacchi'}</span><input required type={formCategory === 'casse' ? 'text' : 'number'} inputMode={formCategory === 'casse' ? 'text' : 'numeric'} value={form.count ?? ''} onChange={(event) => setForm((current) => ({ ...current, count: event.target.value }))} placeholder={formCategory === 'casse' ? 'Es. A12, 99001, CASSA-7' : undefined} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none ring-offset-background focus:ring-2 focus:ring-ring" /></label>}{formCategory === 'siluri' && <label className="space-y-2 text-sm font-semibold"><span>Cliente di scarico</span><input value={form.code?.toUpperCase() === '1440IR' ? 'AGRISTAR/FODDI' : 'AGRISTAR'} readOnly aria-readonly="true" className="h-11 w-full rounded-xl border border-input bg-muted px-3 font-normal text-muted-foreground" /></label>}{formCategory === 'casse' && form.movement !== 'scarico' && <label className="space-y-2 text-sm font-semibold"><span>Cliente - TRANS ISOLE</span><input value={CASSA_DEPOSITO_CLIENT} readOnly aria-readonly="true" className="h-11 w-full rounded-xl border border-input bg-muted px-3 font-normal text-muted-foreground" /></label>}{formCategory === 'sacchi' && <label className="space-y-2 text-sm font-semibold"><span>Pedane EPAL</span><input required type="number" value={form.epal ?? ''} onChange={(event) => setForm((current) => ({ ...current, epal: event.target.value }))} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label>}{formCategory !== 'siluri' && !(formCategory === 'casse' && form.movement === 'scarico') && <><label className="space-y-2 text-sm font-semibold"><span>Movimento</span><select required value={form.movement ?? 'carico'} onChange={(event) => setForm((current) => ({ ...current, movement: event.target.value }))} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal"><option value="carico">Carico</option><option value="scarico">Scarico</option></select></label><label className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-3 py-3 text-sm font-semibold"><input type="checkbox" checked={(form.available ?? 'no') === 'si'} onChange={(event) => setForm((current) => ({ ...current, available: event.target.checked ? 'si' : 'no' }))} className="h-5 w-5 accent-primary" /><span>Disponibile</span></label></>}{formCategory !== 'siluri' && <label className="space-y-2 text-sm font-semibold sm:col-span-2"><span>{form.movement === 'scarico' ? 'NOTA SCARICO' : 'NOTE CASSA'}</span><textarea value={form.note ?? ''} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder={form.movement === 'scarico' ? 'Inserisci una nota per lo scarico' : 'Annotazioni sul carico'} className="min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 font-normal" /></label>}</div><div className="mt-6 flex flex-wrap justify-end gap-3"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><ArrowDownToLine size={16} />Importa CSV da Excel<input type="file" accept=".csv,.txt" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file).catch(() => toast.error('Importa un CSV esportato da Excel con intestazioni riconoscibili.')); }} /></label><button type="submit" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{form.movement === 'scarico' ? 'Salva scarico' : 'Salva nuovo carico'}</button></div></form></div>}</div>;
}
