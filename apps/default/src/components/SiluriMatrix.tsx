import * as React from 'react';
import { Check, LoaderCircle, Pencil, StickyNote, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createNode, deleteNode, field, formatMetricTons, metricTons, PROJECTS, selectValue, title, updateNode, type NodeRow } from '../services/magazzinoApi';
import { formatRomeDate } from '../lib/rome-time';

type SiluriMatrixProps = {
  rows: NodeRow[];
  statusRows: NodeRow[];
  consumptionRows: NodeRow[];
  currentBalance: number;
  selectedCode?: string;
  productName?: string;
  editable: boolean;
  onRefresh: () => Promise<void>;
};

type LoadDraft = {
  code: string;
  lot: string;
  loadDate: string;
  ddt: string;
  quantity: string;
  plate: string;
  client: string;
  note: string;
};

const statusOptions = [
  { value: 'transito', label: 'IN TRANSITO', className: 'border-yellow-400 bg-yellow-300 text-black', rowClassName: 'bg-yellow-200 text-black' },
  { value: 'porto', label: 'PORTO CAGLIARI', className: 'border-cyan-400 bg-cyan-300 text-black', rowClassName: 'bg-cyan-200 text-black' },
  { value: 'deposito', label: 'DAL CLIENTE', className: 'border-orange-400 bg-orange-200 text-black', rowClassName: 'bg-orange-100 text-black' },
  { value: 'vuota', label: 'SVUOTATA', className: 'border-lime-500 bg-lime-300 text-black', rowClassName: 'bg-white text-black' },
] as const;

function normalizeSiluroCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase().replace(/^TM(?=[A-Z0-9])/, '');
}

function dateLabel(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Non registrata';
  const formatted = formatRomeDate(raw);
  return formatted || raw;
}

function dateTimeLabel(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Non registrata';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  }).format(date);
}

function dateTimeLocalValue(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateInputValue(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toIsoDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function statusConfig(value: string) {
  return statusOptions.find((option) => option.value === value) ?? statusOptions[3];
}

function dateValue(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDays(value: number | null) {
  return value === null ? 'N/D' : value.toLocaleString('it-IT', { maximumFractionDigits: 1 });
}

function formatForecast(value: Date | null) {
  return value ? dateLabel(value.toISOString()) : 'N/D';
}

function forecastTone(value: Date | null) {
  if (!value) return { rowClassName: 'bg-cyan-50', borderClassName: 'border-cyan-500/30' };
  const dayMilliseconds = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const forecastDay = new Date(value);
  forecastDay.setHours(0, 0, 0, 0);
  const dayDifference = Math.floor((forecastDay.getTime() - today.getTime()) / dayMilliseconds);
  if (dayDifference <= 0) return { rowClassName: 'bg-red-200', borderClassName: 'border-red-500/60' };
  if (dayDifference <= 2) return { rowClassName: 'bg-yellow-200', borderClassName: 'border-yellow-500/60' };
  return { rowClassName: 'bg-lime-200', borderClassName: 'border-lime-500/60' };
}

function createDraft(row: NodeRow): LoadDraft {
  return {
    code: String(field(row, '@sil01') ?? ''),
    lot: String(field(row, '@sil03') ?? ''),
    loadDate: dateTimeLocalValue(field(row, '@sil04')),
    ddt: String(field(row, '@sil05') ?? ''),
    quantity: String(metricTons(field(row, '@sil06'))),
    plate: String(field(row, '@sil07') ?? ''),
    client: selectValue(field(row, '@sil08')) || 'agristar',
    note: String(field(row, '@sil09') ?? ''),
  };
}

export function SiluriMatrix({ rows, statusRows, consumptionRows, currentBalance, selectedCode, productName, editable, onRefresh }: SiluriMatrixProps) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
  const [positionRowId, setPositionRowId] = React.useState<string | null>(null);
  const [positionDraft, setPositionDraft] = React.useState('');
  const [draft, setDraft] = React.useState<LoadDraft | null>(null);
  const scopedRows = React.useMemo(() => {
    const normalizedCode = normalizeSiluroCode(selectedCode);
    const filtered = normalizedCode ? rows.filter((row) => normalizeSiluroCode(field(row, '@sil01')) === normalizedCode) : rows;
    return filtered.slice().sort((left, right) => String(field(right, '@sil04') ?? '').localeCompare(String(field(left, '@sil04') ?? '')));
  }, [rows, selectedCode]);
  const statusByPlate = React.useMemo(() => new Map(statusRows.map((row) => [String(field(row, '@sst01') ?? '').trim().toUpperCase(), row])), [statusRows]);
  const statusByLoadId = React.useMemo(() => new Map(statusRows.map((row) => [String(field(row, '@sst05') ?? '').trim(), row])), [statusRows]);
  const statusForLoad = React.useCallback((row: NodeRow) => {
    const plate = String(field(row, '@sil07') ?? '').trim().toUpperCase();
    return statusByLoadId.get(row.id) ?? statusByPlate.get(plate);
  }, [statusByLoadId, statusByPlate]);
  const dailyConsumptionByCode = React.useMemo(() => new Map(consumptionRows.map((row) => [normalizeSiluroCode(field(row, '@csm01')), Number(field(row, '@csm02')) || 0])), [consumptionRows]);
  const latestPositionByCode = React.useMemo(() => {
    const latest = new Map<string, { loadDate: Date; positionDate: Date; updatedAt: Date }>();
    rows.forEach((row) => {
      const code = normalizeSiluroCode(field(row, '@sil01'));
      const loadDate = dateValue(field(row, '@sil04'));
      if (!code || !loadDate) return;
      const statusRow = statusForLoad(row);
      const positionDate = dateValue(field(statusRow, '@sst04')) ?? loadDate;
      const updatedAt = dateValue(field(statusRow, '@sst06')) ?? positionDate;
      const previous = latest.get(code);
      if (!previous || loadDate > previous.loadDate) latest.set(code, { loadDate, positionDate, updatedAt });
    });
    return new Map(Array.from(latest.entries()).map(([code, value]) => [code, value]));
  }, [rows, statusForLoad]);

  const startEdit = (row: NodeRow) => {
    if (!editable || savingId) return;
    setEditingRowId(row.id);
    setPositionRowId(null);
    setDraft(createDraft(row));
  };

  const startPositionEdit = (row: NodeRow, statusRow: NodeRow | undefined) => {
    if (!editable || savingId) return;
    setPositionRowId(row.id);
    setEditingRowId(null);
    setDraft(null);
    setPositionDraft(dateInputValue(field(statusRow, '@sst04')));
  };

  const closeEditors = () => {
    setEditingRowId(null);
    setPositionRowId(null);
    setDraft(null);
    setPositionDraft('');
  };

  const saveStatus = async (row: NodeRow, nextStatus: string) => {
    if (!editable || savingId) return;
    const plate = String(field(row, '@sil07') ?? '').trim().toUpperCase();
    if (!plate) {
      toast.error('Inserisci prima la targa del siluro.');
      return;
    }
    const client = selectValue(field(row, '@sil08')) === 'agristar-foddi' ? 'AGRISTAR/FODDI' : 'AGRISTAR';
    const timestamp = new Date().toISOString();
    const existing = statusForLoad(row);
    const hasDuplicatePlate = rows.some((item) => item.id !== row.id && String(field(item, '@sil07') ?? '').trim().toUpperCase() === plate);
    const needsRowStatus = !existing || (hasDuplicatePlate && !String(field(existing, '@sst05') ?? '').trim());
    setSavingId(row.id);
    try {
      if (existing && !needsRowStatus) {
        await updateNode(PROJECTS.statiSiluri, existing.id, {
          '/attributes/@sst01': plate,
          '/attributes/@sst02': nextStatus,
          '/attributes/@sst03': client,
          '/attributes/@sst06': timestamp,
          '/attributes/@sst05': row.id,
        });
      } else {
        await createNode(PROJECTS.statiSiluri, {
          '/text': `Targa ${plate} - ${client}`,
          '/attributes/@sst01': plate,
          '/attributes/@sst02': nextStatus,
          '/attributes/@sst03': client,
          '/attributes/@sst04': timestamp,
          '/attributes/@sst06': timestamp,
          '/attributes/@sst05': row.id,
        });
      }
      toast.success(`Stato ${statusConfig(nextStatus).label.toLowerCase()} salvato.`);
      await onRefresh();
    } catch {
      toast.error('Lo stato del siluro non è stato aggiornato.');
    } finally {
      setSavingId(null);
    }
  };

  const savePosition = async (row: NodeRow) => {
    if (!editable || savingId) return;
    const plate = String(field(row, '@sil07') ?? '').trim().toUpperCase();
    if (!plate || !positionDraft) {
      toast.error('Inserisci una data valida e la targa del siluro.');
      return;
    }
    const existing = statusForLoad(row);
    const client = selectValue(field(row, '@sil08')) === 'agristar-foddi' ? 'AGRISTAR/FODDI' : 'AGRISTAR';
    const positionDate = new Date(`${positionDraft}T00:00:00`);
    const isoDate = Number.isNaN(positionDate.getTime()) ? '' : positionDate.toISOString();
    const updatedAt = new Date().toISOString();
    if (!isoDate) {
      toast.error('La data dell’ultima posizione non è valida.');
      return;
    }
    setSavingId(row.id);
    try {
      if (existing) {
        await updateNode(PROJECTS.statiSiluri, existing.id, { '/attributes/@sst04': isoDate, '/attributes/@sst01': plate, '/attributes/@sst03': client, '/attributes/@sst05': row.id, '/attributes/@sst06': updatedAt });
      } else {
        await createNode(PROJECTS.statiSiluri, { '/text': `Targa ${plate} - ${client}`, '/attributes/@sst01': plate, '/attributes/@sst02': 'transito', '/attributes/@sst03': client, '/attributes/@sst04': isoDate, '/attributes/@sst05': row.id, '/attributes/@sst06': updatedAt });
      }
      toast.success('Ultima posizione aggiornata.');
      closeEditors();
      await onRefresh();
    } catch {
      toast.error('La data dell’ultima posizione non è stata aggiornata.');
    } finally {
      setSavingId(null);
    }
  };

  const saveLoad = async (row: NodeRow) => {
    if (!editable || savingId || !draft) return;
    const quantity = Number(draft.quantity);
    if (!draft.code.trim() || !draft.loadDate || !draft.plate.trim() || !Number.isFinite(quantity)) {
      toast.error('Compila codice, data carico, quantità e targa.');
      return;
    }
    const isoDate = toIsoDate(draft.loadDate);
    if (!isoDate) {
      toast.error('La data carico non è valida.');
      return;
    }
    const existingStatus = statusForLoad(row);
    const nextPlate = draft.plate.trim().toUpperCase();
    const nextClient = draft.client === 'agristar-foddi' ? 'agristar-foddi' : 'agristar';
    setSavingId(row.id);
    try {
      await updateNode(PROJECTS.siluri, row.id, {
        '/attributes/@sil01': draft.code.trim().toUpperCase(),
        '/attributes/@sil03': draft.lot.trim(),
        '/attributes/@sil04': isoDate,
        '/attributes/@sil05': draft.ddt.trim(),
        '/attributes/@sil06': quantity * 10,
        '/attributes/@sil07': nextPlate,
        '/attributes/@sil08': nextClient,
        '/attributes/@sil09': draft.note.trim(),
      });
      if (existingStatus) {
        await updateNode(PROJECTS.statiSiluri, existingStatus.id, {
          '/attributes/@sst01': nextPlate,
          '/attributes/@sst03': nextClient === 'agristar-foddi' ? 'AGRISTAR/FODDI' : 'AGRISTAR',
          '/attributes/@sst05': row.id,
        });
      }
      toast.success('Carico siluro aggiornato.');
      closeEditors();
      await onRefresh();
    } catch {
      toast.error('Il carico siluro non è stato aggiornato.');
    } finally {
      setSavingId(null);
    }
  };

  const removeLoad = async (row: NodeRow) => {
    if (!editable || savingId) return;
    const code = String(field(row, '@sil01') ?? '').trim();
    const plate = String(field(row, '@sil07') ?? '').trim().toUpperCase();
    const confirmed = window.confirm(`Eliminare il carico ${code || 'selezionato'}${plate ? ` della targa ${plate}` : ''}? L'operazione non può essere annullata.`);
    if (!confirmed) return;
    setSavingId(row.id);
    try {
      await deleteNode(PROJECTS.siluri, row.id);
      const remainingForPlate = rows.filter((item) => item.id !== row.id && String(field(item, '@sil07') ?? '').trim().toUpperCase() === plate);
      const statusRow = statusForLoad(row);
      if (plate && remainingForPlate.length === 0 && statusRow) await deleteNode(PROJECTS.statiSiluri, statusRow.id);
      toast.success('Carico siluro eliminato.');
      closeEditors();
      await onRefresh();
    } catch {
      toast.error('Il carico siluro non è stato eliminato.');
    } finally {
      setSavingId(null);
    }
  };

  const hasRows = scopedRows.length > 0;
  const visibleCode = selectedCode || 'tutti i codici';
  const visiblePlates = Array.from(new Set(scopedRows.map((row) => String(field(row, '@sil07') ?? '').trim().toUpperCase()).filter(Boolean))).join(' · ');
  const latestRow = scopedRows[0];
  const latestCode = normalizeSiluroCode(field(latestRow, '@sil01'));
  const latestDailyConsumption = dailyConsumptionByCode.get(latestCode) ?? 0;
  const latestQuantity = metricTons(currentBalance);
  const latestPosition = latestPositionByCode.get(latestCode);
  const latestAnchorDate = latestPosition?.positionDate ?? dateValue(field(latestRow, '@sil04'));
  const latestUpdatedAt = latestPosition?.updatedAt ?? latestAnchorDate;
  const dayMilliseconds = 24 * 60 * 60 * 1000;
  const latestElapsedDays = latestAnchorDate ? Math.max(0, (now.getTime() - latestAnchorDate.getTime()) / dayMilliseconds) : 0;
  const latestStartingDaysAutonomy = latestDailyConsumption > 0 ? Math.max(latestQuantity, 0) / latestDailyConsumption : null;
  const latestDaysAutonomy = latestStartingDaysAutonomy !== null ? Math.max(latestStartingDaysAutonomy - latestElapsedDays, 0) : null;
  const latestAutonomyProgress = latestStartingDaysAutonomy === null || latestStartingDaysAutonomy === 0 ? 0 : Math.min(100, Math.max(0, ((latestDaysAutonomy ?? 0) / latestStartingDaysAutonomy) * 100));
  const latestAutonomyBarClass = latestAutonomyProgress <= 25 ? 'h-full rounded-full bg-red-600 transition-all' : latestAutonomyProgress <= 50 ? 'h-full rounded-full bg-amber-500 transition-all' : 'h-full rounded-full bg-cyan-700 transition-all';
  const latestForecast = latestStartingDaysAutonomy !== null && latestAnchorDate ? new Date(latestAnchorDate.getTime() + latestStartingDaysAutonomy * dayMilliseconds) : null;
  const latestTone = forecastTone(latestForecast);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border-2 border-cyan-400/35 bg-background/40 p-3 shadow-[0_0_25px_hsl(var(--primary)/0.1)]">
      <div className="min-w-0"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h3 className="text-xl font-bold">{visibleCode}</h3><span className="text-base font-bold text-foreground">{productName || 'Denominazione non indicata'}</span></div><p className="mt-2 text-sm font-semibold text-foreground">TARGA: {visiblePlates || 'Nessuna targa registrata'}</p><p className="mt-1 text-sm text-muted-foreground">Ogni riga rappresenta un siluro caricato. Lo scarico non si inserisce manualmente: si aggiorna lo stato operativo.</p></div>
      <span className="shrink-0 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-500">{scopedRows.length} siluri</span>
    </div>
    {!hasRows && <div className="rounded-2xl border border-dashed border-cyan-400/35 px-4 py-10 text-center text-muted-foreground">Nessun carico registrato per questo codice. Inserisci il primo carico dal pulsante qui sopra.</div>}
    {hasRows && <div className="rounded-2xl border border-cyan-400/30 bg-background/45">
      <table className="matrix-table mobile-stack-table w-full table-fixed text-left text-sm uppercase text-black">
        <colgroup><col className="w-[8%]" /><col className="w-[13%]" /><col className="w-[9%]" /><col className="w-[10%]" /><col className="w-[14%]" /><col className="w-[10%]" /><col className="w-[19%]" /><col className="w-[17%]" /></colgroup>
        <thead><tr className="border-b-2 border-cyan-400/35 text-sm tracking-wide text-muted-foreground"><th className="px-3 py-3">DDT</th><th className="px-3 py-3">DATA CARICO</th><th className="px-3 py-3">TM</th><th className="px-3 py-3">LOTTO</th><th className="px-3 py-3">ULTIMA POSIZIONE</th><th className="px-3 py-3">TARGA</th><th className="px-3 py-3">STATO</th><th className="px-3 py-3">AZIONI</th></tr></thead>
        <tbody>{scopedRows.map((row) => {
          const plate = String(field(row, '@sil07') ?? '').trim().toUpperCase();
          const statusRow = statusForLoad(row);
          const currentStatus = selectValue(field(statusRow, '@sst02')) || 'transito';
          const config = statusConfig(currentStatus);
          const isSaving = savingId === row.id;
          const rowTitle = title(row);
          const isEditing = editingRowId === row.id;
          const isEditingPosition = positionRowId === row.id;
          const note = String(field(row, '@sil09') ?? '').trim();
          return <React.Fragment key={row.id}><tr className={`border-b border-black/15 last:border-0 text-black transition-colors ${config.rowClassName}`}>
            <td data-label="DDT" className="px-3 py-3 font-semibold">{String(field(row, '@sil05') ?? '')}</td>
            <td data-label="DATA CARICO" className="px-3 py-3 font-bold">{dateLabel(field(row, '@sil04'))}</td>
            <td data-label="TM" className="px-3 py-3 font-extrabold tabular-nums">{formatMetricTons(field(row, '@sil06'))}</td>
            <td data-label="LOTTO" className="px-3 py-3 font-bold">{String(field(row, '@sil03') ?? '')}</td>
            <td data-label="ULTIMA POSIZIONE" className="px-3 py-3 font-bold">{dateLabel(field(statusRow, '@sst04'))}</td>
            <td data-label="TARGA" className="px-3 py-3 font-semibold">{plate || 'Targa da inserire'}</td>
            <td data-label="STATO" className="px-3 py-2 align-middle"><label className="block w-full min-w-0"><span className="sr-only">Stato {rowTitle}</span><select aria-label={`Stato ${rowTitle}`} value={currentStatus} disabled={!editable || isSaving} onChange={(event) => { void saveStatus(row, event.target.value); }} className={`block h-10 w-full min-w-0 rounded-lg border px-2 py-1 text-[11px] font-extrabold leading-tight tracking-wide text-black outline-none focus:ring-2 focus:ring-black/30 disabled:cursor-not-allowed disabled:opacity-60 ${config.className}`}><option className="text-black" value="transito">IN TRANSITO</option><option className="text-black" value="porto">PORTO CAGLIARI</option><option className="text-black" value="deposito">DAL CLIENTE</option><option className="text-black" value="vuota">SVUOTATA</option></select>{isSaving && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold normal-case text-black"><LoaderCircle size={12} className="animate-spin" />Salvataggio</span>}{!isSaving && statusRow && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold normal-case text-black"><Check size={12} />Data aggiornata</span>}</label></td>
            <td data-label="AZIONI" className="px-3 py-2 align-middle"><div className="flex flex-wrap gap-2"><button type="button" disabled={!editable || isSaving} onClick={() => startEdit(row)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-black/30 bg-white/70 px-2 py-2 text-[10px] font-extrabold text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"><Pencil size={13} />Modifica</button><button type="button" disabled={!editable || isSaving} onClick={() => startPositionEdit(row, statusRow)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-black/30 bg-white/70 px-2 py-2 text-[10px] font-extrabold text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"><Pencil size={13} />Ultima posizione</button><button type="button" disabled={!editable || isSaving} onClick={() => startEdit(row)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-black/30 bg-white/70 px-2 py-2 text-[10px] font-extrabold text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"><StickyNote size={13} />{note ? 'Nota' : 'Nota siluro'}</button><button type="button" disabled={!editable || isSaving} onClick={() => { void removeLoad(row); }} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-rose-500/60 bg-white/70 px-2 py-2 text-[10px] font-extrabold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={13} />Elimina</button></div></td>
          </tr>{latestRow?.id === row.id && <tr className={`border-b ${latestTone.borderClassName} ${latestTone.rowClassName} text-black`}><td colSpan={8} className="p-3 text-black"><div className={`flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border ${latestTone.borderClassName} bg-transparent px-4 py-3 text-black normal-case`}><span className="text-xs font-extrabold uppercase tracking-[0.16em] text-black">Riepilogo ultimo carico</span><span className="font-bold text-black">GIORNI DI AUTONOMIA: <strong className="tabular-nums text-black">{formatDays(latestDaysAutonomy)}</strong>{latestDailyConsumption > 0 && <span className="ml-1 text-xs font-semibold text-black">({latestDailyConsumption.toLocaleString('it-IT')} TM/giorno)</span>}</span><div className="min-w-40 flex-1"><div className="mb-1 flex justify-between gap-2 text-xs font-extrabold text-black"><span>AUTONOMIA RESIDUA</span><span className="tabular-nums">{Math.round(latestAutonomyProgress)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-black/15" role="progressbar" aria-label={`Autonomia residua ${visibleCode}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(latestAutonomyProgress)}><div className={latestAutonomyBarClass} style={{ width: `${latestAutonomyProgress}%` }} /></div></div><span className="font-bold text-black">PREVISIONE CARICO: <strong className="text-black">{formatForecast(latestForecast)}</strong></span>{latestUpdatedAt && <span className="whitespace-nowrap text-xs font-semibold text-black">AGGIORNAMENTO ULTIMA POSIZIONE: {dateTimeLabel(latestUpdatedAt.toISOString())}</span>}</div></td></tr>}{isEditing && draft && <tr className="border-b border-cyan-500/30 bg-cyan-50 text-black"><td colSpan={8} className="p-4"><div className="rounded-xl border border-cyan-500/40 bg-white/80 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Gestione carico siluro</p><p className="mt-1 text-sm font-semibold">Modifica l’intero carico e la NOTA SILURO.</p></div><button type="button" onClick={closeEditors} className="min-h-10 rounded-lg border border-black/30 px-3 text-xs font-bold">Annulla</button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="space-y-1 text-xs font-bold"><span>Codice</span><input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} className="h-10 w-full rounded-lg border border-black/20 px-2 text-sm font-normal uppercase" /></label><label className="space-y-1 text-xs font-bold"><span>Lotto</span><input value={draft.lot} onChange={(event) => setDraft({ ...draft, lot: event.target.value })} className="h-10 w-full rounded-lg border border-black/20 px-2 text-sm font-normal" /></label><label className="space-y-1 text-xs font-bold"><span>Data carico</span><input type="datetime-local" value={draft.loadDate} onChange={(event) => setDraft({ ...draft, loadDate: event.target.value })} className="h-10 w-full rounded-lg border border-black/20 px-2 text-sm font-normal" /></label><label className="space-y-1 text-xs font-bold"><span>DDT</span><input value={draft.ddt} onChange={(event) => setDraft({ ...draft, ddt: event.target.value })} className="h-10 w-full rounded-lg border border-black/20 px-2 text-sm font-normal" /></label><label className="space-y-1 text-xs font-bold"><span>Quantità TM</span><input type="number" min="0" step="0.01" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} className="h-10 w-full rounded-lg border border-black/20 px-2 text-sm font-normal" /></label><label className="space-y-1 text-xs font-bold"><span>Targa</span><input value={draft.plate} onChange={(event) => setDraft({ ...draft, plate: event.target.value })} className="h-10 w-full rounded-lg border border-black/20 px-2 text-sm font-normal uppercase" /></label><label className="space-y-1 text-xs font-bold"><span>Cliente</span><select value={draft.client} onChange={(event) => setDraft({ ...draft, client: event.target.value })} className="h-10 w-full rounded-lg border border-black/20 px-2 text-sm font-normal"><option value="agristar">AGRISTAR</option><option value="agristar-foddi">AGRISTAR/FODDI</option></select></label><label className="space-y-1 text-xs font-bold sm:col-span-2 lg:col-span-4"><span>NOTA SILURO</span><textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} rows={3} placeholder="Inserisci una nota sul siluro" className="w-full resize-y rounded-lg border border-black/20 px-2 py-2 text-sm font-normal normal-case" /></label></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={isSaving} onClick={() => { void saveLoad(row); }} className="min-h-11 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{isSaving ? 'Salvataggio...' : 'Salva carico e nota'}</button><button type="button" disabled={isSaving} onClick={() => { void removeLoad(row); }} className="min-h-11 rounded-lg border border-rose-500/60 px-4 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">Elimina carico</button></div></div></td></tr>}{isEditingPosition && <tr className="border-b border-cyan-500/30 bg-cyan-50 text-black"><td colSpan={8} className="p-4"><div className="flex flex-wrap items-end gap-3 rounded-xl border border-cyan-500/40 bg-white/80 p-4"><label className="min-w-[15rem] flex-1 space-y-1 text-xs font-bold"><span>DATA ULTIMA POSIZIONE</span><input type="date" value={positionDraft} onChange={(event) => setPositionDraft(event.target.value)} className="h-11 w-full rounded-lg border border-black/20 px-2 text-sm font-normal" /></label><button type="button" disabled={isSaving} onClick={() => { void savePosition(row); }} className="min-h-11 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{isSaving ? 'Salvataggio...' : 'Salva ultima posizione'}</button><button type="button" disabled={isSaving} onClick={closeEditors} className="min-h-11 rounded-lg border border-black/30 px-4 py-2 text-xs font-bold">Annulla</button></div></td></tr>}</React.Fragment>;
        })}</tbody>
      </table>
    </div>}
    {hasRows && <p className="text-xs text-muted-foreground">Il cambio di stato aggiorna automaticamente ULTIMA POSIZIONE. Usa AZIONI per modificare il carico, inserire una NOTA SILURO, correggere la data o eliminare la riga.</p>}
  </div>;
}
