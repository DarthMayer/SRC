import * as React from 'react';
import { Clock3, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { createNode, field, metricTons, PROJECTS, selectValue, type NodeRow, updateNode } from '../services/magazzinoApi';

type Props = {
  kind: 'siluri' | 'casse';
  loadRows: NodeRow[];
  statusRows: NodeRow[];
  editable: boolean;
  onRefresh: () => Promise<void>;
};

const siluroStates = [
  { value: 'vuota', label: 'VUOTA', className: 'border-lime-500 bg-lime-300 text-black' },
  { value: 'transito', label: 'IN TRANSITO', className: 'border-yellow-400 bg-yellow-300 text-black' },
  { value: 'porto', label: 'PORTO CAGLIARI', className: 'border-cyan-400 bg-cyan-300 text-black' },
  { value: 'deposito', label: 'DAL CLIENTE', className: 'border-orange-400 bg-orange-200 text-black' },
] as const;

const cassaStates = [
  { value: 'vuota', label: 'VUOTA', className: 'border-rose-400 bg-rose-200 text-black' },
  { value: 'transito', label: 'IN TRANSITO', className: 'border-yellow-400 bg-yellow-300 text-black' },
  { value: 'porto', label: 'PORTO CAGLIARI', className: 'border-cyan-400 bg-cyan-300 text-black' },
  { value: 'deposito', label: 'DEPOSITO CAGLIARI', className: 'border-emerald-400 bg-emerald-300 text-black' },
  { value: 'modugno', label: 'MODUGNO', className: 'border-amber-400 bg-amber-200 text-black' },
  { value: 'salerno', label: 'SALERNO', className: 'border-orange-400 bg-orange-200 text-black' },
] as const;

function dateLabel(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'N/D';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' }).format(date);
}

function stateConfig(kind: Props['kind'], value: string) {
  const states = kind === 'siluri' ? siluroStates : cassaStates;
  return states.find((state) => state.value === value) ?? states[0];
}

export function TargheOperationsPanel({ kind, loadRows, statusRows, editable, onRefresh }: Props) {
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const isSiluro = kind === 'siluri';
  const statusByPlate = React.useMemo(() => new Map(statusRows.map((row) => [String(field(row, isSiluro ? '@sst01' : '@cst01') ?? '').trim().toUpperCase(), row])), [isSiluro, statusRows]);
  const statusByLoadId = React.useMemo(() => new Map(statusRows.map((row) => [String(field(row, '@sst05') ?? '').trim(), row])), [statusRows]);
  const records = React.useMemo(() => {
    const byPlate = new Map<string, NodeRow>();
    loadRows.forEach((row) => {
      const plate = String(field(row, isSiluro ? '@sil07' : '@cas07') ?? '').trim().toUpperCase();
      if (plate && !byPlate.has(plate)) byPlate.set(plate, row);
    });
    statusRows.forEach((row) => {
      const plate = String(field(row, isSiluro ? '@sst01' : '@cst01') ?? '').trim().toUpperCase();
      if (plate && !byPlate.has(plate)) byPlate.set(plate, row);
    });
    return Array.from(byPlate.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [isSiluro, loadRows, statusRows]);

  const saveState = async (plate: string, nextState: string) => {
    if (!editable || savingId) return;
    const loadRow = records.find(([currentPlate]) => currentPlate === plate)?.[1];
    const existing = statusByPlate.get(plate);
    const timestamp = new Date().toISOString();
    setSavingId(plate);
    try {
      if (isSiluro) {
        const linkedLoad = loadRow && field(loadRow, '@sil07') ? loadRow : undefined;
        const positionLabel = stateConfig('siluri', nextState).label;
        const values = {
          '/attributes/@sst01': plate,
          '/attributes/@sst02': { type: 'Select', optionId: nextState },
          '/attributes/@sst03': linkedLoad ? (selectValue(field(linkedLoad, '@sil08')) === 'agristar-foddi' ? 'AGRISTAR/FODDI' : 'AGRISTAR') : String(field(existing, '@sst03') ?? 'AGRISTAR'),
          '/attributes/@sst04': timestamp,
          '/attributes/@sst05': linkedLoad?.id ?? String(field(existing, '@sst05') ?? ''),
          '/attributes/@sst06': timestamp,
        };
        if (linkedLoad) await updateNode(PROJECTS.siluri, linkedLoad.id, { '/attributes/@sil09': positionLabel });
        if (existing) await updateNode(PROJECTS.statiSiluri, existing.id, values);
        else await createNode(PROJECTS.statiSiluri, { '/text': `Targa ${plate} - AGRISTAR`, ...values });
      } else {
        const samePlateLoads = loadRows.filter((row) => String(field(row, '@cas07') ?? '').trim().toUpperCase() === plate);
        await Promise.all(samePlateLoads.map((row) => updateNode(PROJECTS.casse, row.id, {
          '/attributes/@cas09': nextState === 'vuota' ? 'VUOTA' : nextState === 'deposito' ? 'DEPOSITO CAGLIARI' : nextState === 'porto' ? 'PORTO CAGLIARI' : nextState === 'modugno' ? 'MODUGNO' : nextState === 'salerno' ? 'SALERNO' : 'IN TRANSITO',
        })));
        const cassaNumber = samePlateLoads[0] ? Number(field(samePlateLoads[0], '@cas08')) || 0 : Number(field(existing, '@cst02')) || 0;
        const values = { '/attributes/@cst01': plate, '/attributes/@cst02': cassaNumber, '/attributes/@cst03': { type: 'Select', optionId: nextState }, '/attributes/@cst04': timestamp };
        if (existing) await updateNode(PROJECTS.statiCasse, existing.id, values);
        else await createNode(PROJECTS.statiCasse, { '/text': `Targa ${plate}`, ...values });
      }
      toast.success(`Ultima posizione di ${plate} aggiornata.`);
      await onRefresh();
    } catch {
      toast.error('La posizione della targa non è stata aggiornata.');
    } finally {
      setSavingId(null);
    }
  };

  return <section className="rounded-2xl border-2 border-primary/25 bg-background/45 p-4 shadow-[0_0_25px_hsl(var(--primary)/0.08)]">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="rounded-xl bg-primary/15 p-3 text-primary"><Truck size={22} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Registro operativo</p><h2 className="mt-1 text-xl font-semibold">TARGHE {isSiluro ? 'SILURI' : 'CASSE'}</h2><p className="mt-2 text-sm text-muted-foreground">La posizione e i colori sono collegati direttamente alle righe di carico.</p></div></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{records.length} targhe</span></div>
    <div className="mt-5 overflow-x-auto rounded-xl border border-border/70"><table className="min-w-[62rem] w-full text-left text-sm"><thead><tr className="border-b-2 border-primary/25 bg-primary/5 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Targa</th><th className="px-3 py-3">Codice</th><th className="px-3 py-3">Prodotto</th><th className="px-3 py-3">Data carico</th><th className="px-3 py-3">TM</th><th className="px-3 py-3">Ultima posizione</th><th className="px-3 py-3">AGGIORNAMENTO</th></tr></thead><tbody>{records.map(([plate]) => {
      const loadRow = loadRows.find((candidate) => String(field(candidate, isSiluro ? '@sil07' : '@cas07') ?? '').trim().toUpperCase() === plate);
      const statusRow = isSiluro ? (statusByLoadId.get(loadRow?.id ?? '') ?? statusByPlate.get(plate)) : statusByPlate.get(plate);
      const state = isSiluro ? selectValue(field(statusRow, '@sst02')) || 'vuota' : (String(field(loadRow, '@cas09') ?? '').toUpperCase().includes('VUOT') ? 'vuota' : String(field(loadRow, '@cas09') ?? '').toUpperCase().includes('DEPOSIT') ? 'deposito' : 'transito');
      const config = stateConfig(kind, state);
      const isEmpty = state === 'vuota';
      const updatedAt = field(statusRow, isSiluro ? '@sst04' : '@cst04');
      return <tr key={plate} className={`border-b border-black/10 ${config.className}`}><td className="px-3 py-3 font-mono font-bold">{plate}</td><td className="px-3 py-3 font-semibold">{isEmpty ? '' : String(field(loadRow, isSiluro ? '@sil01' : '@cas01') ?? '')}</td><td className="px-3 py-3">{isEmpty ? '' : String(field(loadRow, isSiluro ? '@sil02' : '@cas02') ?? '')}</td><td className="px-3 py-3">{isEmpty ? '' : dateLabel(field(loadRow, isSiluro ? '@sil04' : '@cas04'))}</td><td className="px-3 py-3 font-bold tabular-nums">{isEmpty ? '' : loadRow ? metricTons(field(loadRow, isSiluro ? '@sil06' : '@cas06')).toLocaleString('it-IT') : ''}</td><td className="px-3 py-3"><select aria-label={`Ultima posizione ${plate}`} disabled={!editable || savingId === plate} value={state} onChange={(event) => { void saveState(plate, event.target.value); }} className={`h-10 rounded-lg border px-2 text-xs font-extrabold text-black ${config.className}`}>{(isSiluro ? siluroStates : cassaStates).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td><td className="px-3 py-3 text-xs font-semibold tabular-nums"><span className="inline-flex items-center gap-1"><Clock3 size={14} />{isEmpty ? '' : dateLabel(updatedAt)}</span></td></tr>;
    })}</tbody></table></div>
  </section>;
}
