import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createNode, deleteNode, field, formatMetricTons, metricTons, numeric, PROJECTS, selectValue, type NodeRow, updateNode } from '../services/magazzinoApi';
import { ROME_TIME_ZONE } from '../lib/rome-time';

type CasseMatrixProps = {
  rows: NodeRow[];
  mangimiRows: NodeRow[];
  editable: boolean;
  selectedCode?: string;
  onRefresh: () => Promise<void>;
  onAddDischarge?: (cassaReference: string) => void;
  plateOptions?: string[];
};

function dateLabel(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  const parts = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: ROME_TIME_ZONE }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.day}/${values.month}/${values.year}`;
}

function dateInputValue(value: unknown) {
  const raw = String(value ?? '');
  return raw.includes('T') ? raw.slice(0, 10) : raw.slice(0, 10);
}

function movementOf(row: NodeRow) {
  const movement = selectValue(field(row, '@cas11'));
  return movement === 'scarico' ? 'scarico' : 'carico';
}

function availableOf(row: NodeRow) {
  return selectValue(field(row, '@cas12')) === 'si';
}

function draftFromRow(row: NodeRow) {
  return {
    code: String(field(row, '@cas01') ?? ''),
    ddt: String(field(row, '@cas05') ?? ''),
    date: dateInputValue(field(row, '@cas04')),
    quantity: String(metricTons(field(row, '@cas06'))),
    client: String(field(row, '@cas09') ?? ''),
    lot: String(field(row, '@cas03') ?? ''),
    cassa: String(field(row, '@cas08') ?? ''),
    plate: String(field(row, '@cas07') ?? ''),
    movement: movementOf(row),
    available: availableOf(row) ? 'si' : 'no',
    note: String(field(row, '@cas10') ?? ''),
  };
}

type CassaDraft = ReturnType<typeof draftFromRow>;

function rowsForGroup(rows: NodeRow[]) {
  return rows.slice().sort((a, b) => String(field(b, '@cas04') ?? '').localeCompare(String(field(a, '@cas04') ?? '')));
}

const positionOptions = [
  { value: 'VUOTA', label: 'VUOTA' },
  { value: 'IN TRANSITO', label: 'IN TRANSITO' },
  { value: 'DEPOSITO CAGLIARI', label: 'DEPOSITO CAGLIARI' },
];

export function CasseMatrix({ rows, mangimiRows, editable, selectedCode, onRefresh, onAddDischarge, plateOptions = [] }: CasseMatrixProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<CassaDraft | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [noteEditingId, setNoteEditingId] = React.useState<string | null>(null);
  const [noteDraft, setNoteDraft] = React.useState('');
  const scopedRows = React.useMemo(() => selectedCode ? rows.filter((row) => String(field(row, '@cas01') ?? '').trim().toUpperCase() === selectedCode.toUpperCase()) : rows, [rows, selectedCode]);
  const groups = React.useMemo(() => {
    const grouped = new Map<string, NodeRow[]>();
    scopedRows.forEach((row) => {
      const key = String(field(row, '@cas08') ?? '').trim() || `cassa-${row.id}`;
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    });
    return Array.from(grouped.entries()).map(([key, entries]) => {
      const sorted = rowsForGroup(entries);
      const loads = sorted.filter((row) => movementOf(row) === 'carico');
      const discharges = sorted.filter((row) => movementOf(row) === 'scarico');
      const presentLoads = loads.filter(availableOf);
      const incomingLoads = loads.filter((row) => !availableOf(row));
      const dischargeTotal = discharges.reduce((sum, row) => sum + numeric(field(row, '@cas06')), 0);
      const operationalBalance = presentLoads.reduce((sum, row) => sum + numeric(field(row, '@cas06')), 0) - dischargeTotal;
      const balance = loads.reduce((sum, row) => sum + numeric(field(row, '@cas06')), 0) - dischargeTotal;
      return { key, loads, discharges, balance, operationalBalance, hasPresentLoad: presentLoads.length > 0, hasIncoming: incomingLoads.length > 0 };
    }).sort((left, right) => String(field(right.loads[0] ?? right.discharges[0], '@cas04') ?? '').localeCompare(String(field(left.loads[0] ?? left.discharges[0], '@cas04') ?? '')));
  }, [scopedRows]);

  const beginEdit = (row: NodeRow) => {
    if (!editable || savingId) return;
    setEditingId(row.id);
    setDraft(draftFromRow(row));
  };

  const setDraftValue = (key: keyof CassaDraft, value: string) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };

  const startNoteEdit = (row: NodeRow) => {
    if (!editable || savingId) return;
    setNoteEditingId(row.id);
    setNoteDraft(String(field(row, '@cas10') ?? ''));
  };

  const saveNote = async (row: NodeRow, value = noteDraft) => {
    if (!editable || savingId) return;
    setSavingId(row.id);
    try {
      await updateNode('9kdJVdgKjhA4vMej', row.id, { '/attributes/@cas10': value.trim() });
      setNoteEditingId(null);
      setNoteDraft('');
      toast.success(value.trim() ? 'Nota aggiornata.' : 'Nota eliminata.');
      await onRefresh();
    } catch {
      toast.error('La nota non è stata aggiornata.');
    } finally {
      setSavingId(null);
    }
  };

  const toggleAvailability = async (row: NodeRow) => {
    if (!editable || savingId) return;
    const nextAvailable = !availableOf(row);
    setSavingId(row.id);
    try {
      await updateNode('9kdJVdgKjhA4vMej', row.id, { '/attributes/@cas12': nextAvailable ? 'si' : 'no' });
      toast.success(nextAvailable ? 'Cassa disponibile.' : 'Cassa impostata in arrivo.');
      await onRefresh();
    } catch {
      toast.error('La disponibilità della cassa non è stata aggiornata.');
    } finally {
      setSavingId(null);
    }
  };

  const zeroCassa = async (group: { key: string; loads: NodeRow[]; operationalBalance: number }) => {
    if (!editable || savingId || group.operationalBalance <= 0 || group.operationalBalance >= 9) return;
    const reference = group.loads[0];
    if (!reference) return;
    setSavingId(`zero-${group.key}`);
    try {
      await createNode(PROJECTS.casse, {
        '/text': `Azzeramento cassa ${group.key}`,
        '/attributes/@cas01': String(field(reference, '@cas01') ?? '').trim(),
        '/attributes/@cas02': String(field(reference, '@cas02') ?? '').trim(),
        '/attributes/@cas03': '-',
        '/attributes/@cas04': new Date().toISOString(),
        '/attributes/@cas05': '-',
        '/attributes/@cas06': group.operationalBalance,
        '/attributes/@cas07': String(field(reference, '@cas07') ?? '').trim(),
        '/attributes/@cas08': group.key,
        '/attributes/@cas09': 'AZZERAMENTO',
        '/attributes/@cas10': 'Azzeramento manuale della giacenza residua',
        '/attributes/@cas11': 'scarico',
        '/attributes/@cas12': 'si',
      });
      toast.success('Cassa azzerata.');
      await onRefresh();
    } catch {
      toast.error('La cassa non è stata azzerata.');
    } finally {
      setSavingId(null);
    }
  };

  const deleteCassa = async (group: { key: string; loads: NodeRow[]; discharges: NodeRow[] }) => {
    if (!editable || savingId) return;
    const rowsToDelete = [...group.loads, ...group.discharges];
    const confirmed = window.confirm(`Eliminare completamente la cassa ${group.key}? Verranno eliminati anche tutti i suoi carichi, scarichi e azzeramenti. L'operazione non si può annullare.`);
    if (!confirmed || rowsToDelete.length === 0) return;
    setSavingId(`delete-${group.key}`);
    try {
      for (const row of rowsToDelete) await deleteNode(PROJECTS.casse, row.id);
      toast.success(`Cassa ${group.key} eliminata completamente.`);
      await onRefresh();
    } catch {
      toast.error('La cassa non è stata eliminata completamente. Verifica la matrice e riprova.');
      await onRefresh();
    } finally {
      setSavingId(null);
    }
  };

  const deleteMovement = async (row: NodeRow, loadRow: boolean) => {
    if (!editable || savingId) return;
    const cassa = String(field(row, '@cas08') ?? '').trim();
    const actionLabel = loadRow ? 'carico' : 'scarico';
    if (!window.confirm(`Eliminare questa riga di ${actionLabel}${cassa ? ` della cassa ${cassa}` : ''}? La giacenza verrà ricalcolata.`)) return;
    setSavingId(`delete-row-${row.id}`);
    try {
      await deleteNode(PROJECTS.casse, row.id);
      toast.success(loadRow ? 'Riga di carico eliminata.' : 'Scarico eliminato.');
      void onRefresh().catch(() => toast.error('Riga eliminata, ma non è stato possibile aggiornare la vista.'));
    } catch {
      toast.error(loadRow ? 'Il carico non è stato eliminato.' : 'Lo scarico non è stato eliminato.');
    } finally {
      setSavingId(null);
    }
  };

  const renderAvailabilitySwitch = (row: NodeRow, available: boolean, isEditing: boolean) => {
    const checked = isEditing && draft ? draft.available === 'si' : available;
    const label = checked ? 'DISPONIBILE' : 'IN ARRIVO';
    const handleToggle = () => {
      if (isEditing) {
        setDraftValue('available', checked ? 'no' : 'si');
      } else {
        void toggleAvailability(row);
      }
    };
    return <button type="button" role="switch" aria-checked={checked} aria-label={`Disponibilità: ${label}`} disabled={!editable || Boolean(savingId)} onClick={handleToggle} className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-2 py-1.5 pr-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 ${checked ? 'border-emerald-500/45 bg-emerald-500/10' : 'border-border bg-muted/60'}`}><span className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${checked ? 'bg-emerald-600' : 'bg-muted-foreground/45'}`}><span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} /></span><span className="flex flex-col leading-none"><span className={`text-[10px] font-extrabold tracking-[0.14em] ${checked ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>{checked ? 'ON' : 'OFF'}</span><span className="mt-1 text-[10px] font-semibold tracking-wide text-foreground">{label}</span></span></button>;
  };

  const saveRow = async (row: NodeRow) => {
    if (!editable || !draft || savingId) return;
    const nextPosition = draft.client.trim().toUpperCase();
    const plate = draft.plate.trim();
    setSavingId(row.id);
    try {
      if (nextPosition === 'VUOTA' && plate) {
        const plateRows = rows.filter((candidate) => String(field(candidate, '@cas07') ?? '').trim().toUpperCase() === plate.toUpperCase());
        await Promise.all(plateRows.map((candidate) => updateNode(PROJECTS.casse, candidate.id, {
          '/text': `${plate} - VUOTA`,
          '/attributes/@cas01': null,
          '/attributes/@cas02': null,
          '/attributes/@cas03': null,
          '/attributes/@cas04': null,
          '/attributes/@cas05': null,
          '/attributes/@cas06': null,
          '/attributes/@cas07': plate,
          '/attributes/@cas08': null,
          '/attributes/@cas09': 'VUOTA',
          '/attributes/@cas10': null,
          '/attributes/@cas11': null,
          '/attributes/@cas12': null,
        })));
        toast.success(`Targa ${plate} impostata come VUOTA e dati azzerati.`);
      } else {
        await updateNode(PROJECTS.casse, row.id, {
          '/attributes/@cas01': draft.code.trim(),
          '/attributes/@cas03': draft.lot.trim(),
          '/attributes/@cas04': draft.date,
          '/attributes/@cas05': draft.ddt.trim(),
          '/attributes/@cas06': Number(draft.quantity) * 10,
          '/attributes/@cas07': plate,
          '/attributes/@cas08': draft.cassa.trim(),
          '/attributes/@cas09': nextPosition,
          '/attributes/@cas10': draft.note.trim(),
          '/attributes/@cas11': draft.movement,
          '/attributes/@cas12': draft.available,
        });
        toast.success('Ultima posizione della cassa aggiornata.');
      }
      setEditingId(null);
      setDraft(null);
      await onRefresh();
    } catch {
      toast.error('I dati della cassa non sono stati salvati.');
    } finally {
      setSavingId(null);
    }
  };

  const renderField = (key: keyof CassaDraft, type = 'text', className = '') => {
    if (!draft) return null;
    if (key === 'plate') return <><input list="casse-targhe-options" aria-label="Targa" value={draft.plate} onChange={(event) => setDraftValue('plate', event.target.value.toUpperCase())} placeholder="Inserisci o seleziona la targa" className={`h-10 w-full min-w-0 rounded-lg border border-input !bg-white px-2 !text-black text-sm font-normal normal-case outline-none focus:ring-2 focus:ring-ring ${className}`} /><datalist id="casse-targhe-options">{plateOptions.map((plate) => <option key={plate} value={plate} />)}</datalist></>;
    if (key === 'client') return <select aria-label="Ultima posizione" value={draft.client.toUpperCase()} onChange={(event) => setDraftValue('client', event.target.value)} className={`h-10 w-full min-w-0 rounded-lg border border-input !bg-white px-2 !text-black text-sm font-normal normal-case outline-none focus:ring-2 focus:ring-ring ${className}`}>{positionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
    return <input aria-label={key} type={type} value={draft[key]} onChange={(event) => setDraftValue(key, event.target.value)} className={`h-10 w-full min-w-0 rounded-lg border border-input !bg-white px-2 !text-black text-sm font-normal normal-case outline-none focus:ring-2 focus:ring-ring ${className}`} />;
  };

  const renderNoteArea = (row: NodeRow, loadRow: boolean) => {
    const note = String(field(row, '@cas10') ?? '').trim();
    const noteLabel = loadRow ? 'NOTE CASSA' : 'NOTA SCARICO';
    const editingNote = noteEditingId === row.id;
    if (editingNote) {
      return <div className="min-w-0 flex-1"><textarea aria-label={`${noteLabel} ${String(field(row, '@cas08') ?? '')}`} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} rows={2} autoFocus className="min-h-16 w-full resize-y rounded-lg border border-input !bg-white px-3 py-2 !text-black text-sm font-normal normal-case outline-none focus:ring-2 focus:ring-ring" /><div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={savingId === row.id} onClick={() => { void saveNote(row); }} className="min-h-10 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50">{savingId === row.id ? 'Salvataggio...' : 'Salva nota'}</button><button type="button" disabled={savingId === row.id} onClick={() => { setNoteEditingId(null); setNoteDraft(''); }} className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold">Annulla</button></div></div>;
    }
    return <div className="min-w-0 flex-1">{note && <><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{noteLabel}</p><p className="mt-1 whitespace-pre-wrap text-sm normal-case text-foreground">{note}</p></>}<div className="mt-2 flex flex-wrap gap-2">{editable && <button type="button" onClick={() => startNoteEdit(row)} className="min-h-10 rounded-lg border border-primary/50 px-3 text-xs font-bold text-primary hover:bg-primary/10">{note ? 'Modifica nota' : `Inserisci ${loadRow ? 'nota' : 'nota scarico'}`}</button>}{editable && note && <button type="button" disabled={savingId === row.id} onClick={() => { void saveNote(row, ''); }} className="min-h-10 rounded-lg border border-rose-400/50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-500/10 disabled:opacity-50">Elimina nota</button>}</div></div>;
  };

  const renderRow = (row: NodeRow, loadRow: boolean, depleted: boolean) => {
    const isEditing = editingId === row.id && draft !== null;
    const available = availableOf(row);
    const zeroing = !loadRow && String(field(row, '@cas09') ?? '').trim().toUpperCase() === 'AZZERAMENTO';
    const dataRowClass = `${zeroing ? 'matrix-zero-discharge' : loadRow ? (depleted && available ? 'matrix-depleted-load' : available ? 'matrix-available' : 'matrix-incoming') : (depleted ? 'matrix-depleted-discharge' : 'matrix-discharge')}`;
    const noteRowClass = zeroing ? 'matrix-note-row matrix-zero-note-row border-t border-border/70' : 'matrix-note-row border-t border-border/70';
    return <React.Fragment key={row.id}>
      <tr className={dataRowClass}>
        <td data-label="DDT" className="px-2 py-2">{isEditing ? renderField('ddt') : String(field(row, '@cas05') ?? '')}</td>
        <td data-label="DATA" className="px-2 py-2">{isEditing ? renderField('date', 'date') : dateLabel(field(row, '@cas04'))}</td>
        <td data-label="TM" className="px-2 py-2 font-extrabold tabular-nums">{isEditing ? renderField('quantity', 'number', 'font-extrabold') : formatMetricTons(field(row, '@cas06'))}</td>
        <td data-label="ULTIMA POSIZIONE" className="px-2 py-2">{isEditing ? renderField('client') : String(field(row, '@cas09') ?? '')}</td>
        <td data-label="LOTTO" className="px-2 py-2">{isEditing ? renderField('lot') : String(field(row, '@cas03') ?? '')}</td>
        <td data-label="TARGA / CASSA" className="px-2 py-2"><div className="space-y-1"><div className="text-sm">{isEditing ? renderField('plate') : String(field(row, '@cas07') ?? '')}</div><div className="text-sm font-semibold normal-case opacity-90">{isEditing ? renderField('cassa') : String(field(row, '@cas08') ?? '')}</div></div></td>
      </tr>
      <tr className={noteRowClass}>
        <td colSpan={6} className="px-3 py-3">
          <div className="flex flex-wrap items-start gap-3 border-l-4 border-border pl-3">
            {renderNoteArea(row, loadRow)}
            <div className="flex flex-wrap items-center gap-2">
              {loadRow && renderAvailabilitySwitch(row, available, isEditing)}
              {isEditing ? <div className="flex flex-wrap gap-2"><button type="button" disabled={savingId === row.id} onClick={() => { void saveRow(row); }} className="min-h-10 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50">{savingId === row.id ? 'Salvataggio...' : 'Salva riga'}</button><button type="button" disabled={savingId === row.id} onClick={() => { setEditingId(null); setDraft(null); }} className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold">Annulla</button></div> : editable ? <div className="flex flex-wrap gap-2"><button type="button" onClick={() => beginEdit(row)} className="min-h-10 rounded-lg border border-primary/50 px-3 text-xs font-bold text-primary hover:bg-primary/10">Modifica riga</button><button type="button" disabled={savingId === `delete-row-${row.id}`} onClick={() => { void deleteMovement(row, loadRow); }} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-rose-500/50 px-3 text-xs font-bold text-rose-600 disabled:opacity-50"><Trash2 size={13} />{loadRow ? 'Elimina carico' : 'ELIMINA SCARICO'}</button></div> : <span className="text-xs text-muted-foreground">Sola lettura</span>}
            </div>
          </div>
        </td>
      </tr>
    </React.Fragment>;
  };

  return <div className="space-y-5">
    <div className="flex justify-end"><span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{groups.length} casse</span></div>
    {groups.length === 0 && <div className="rounded-2xl border border-dashed border-primary/35 px-4 py-10 text-center text-muted-foreground">Nessun carico registrato per questo codice mangime.</div>}
    {groups.map((group) => {
      const depleted = group.hasPresentLoad && group.operationalBalance < 60;
      const incomingOnly = group.hasIncoming && !group.hasPresentLoad;
      const statusText = incomingOnly ? 'IN ARRIVO' : depleted ? 'GIACENZA SOTTO 6 Q.LI' : 'GIACENZA PRESENTE';
      const representative = group.loads[0] ?? group.discharges[0];
      const productCode = String(field(representative, '@cas01') ?? selectedCode ?? '').trim() || 'Codice prodotto';
      const catalogName = String(field(mangimiRows.find((item) => String(field(item, '@cod01') ?? '').trim().toUpperCase() === productCode.toUpperCase()), '@den01') ?? '').trim();
      const productName = catalogName || String(field(representative, '@cas02') ?? '').trim() || 'Denominazione prodotto';
      const plate = String(field(representative, '@cas07') ?? '').trim() || 'Targa non indicata';
      const headers = ['DDT', 'DATA', 'TM', 'ULTIMA POSIZIONE', 'LOTTO', 'TARGA / CASSA'];
      return <section key={group.key} className={`overflow-hidden rounded-2xl border-2 ${incomingOnly ? 'border-primary/50' : depleted ? 'border-border' : 'border-primary/35'} bg-background/45 shadow-[0_0_25px_hsl(var(--primary)/0.1)]`}>
        <div className="flex flex-wrap items-center justify-between gap-3 bg-primary/10 px-4 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Carico cassa</p><h4 className="text-lg font-semibold">CODICE: {productCode}</h4><p className="text-sm font-semibold text-foreground">DENOMINAZIONE: {productName}</p><p className="text-sm font-semibold text-foreground">TARGA: {plate}</p></div><div className="flex flex-wrap items-center justify-end gap-2"><div className="rounded-xl bg-accent px-3 py-2 text-right"><p className="text-[11px] font-bold uppercase tracking-wide">Giacenza totale</p><p className="text-lg font-extrabold tabular-nums">{formatMetricTons(group.balance)} TM</p><p className="text-[11px] font-bold uppercase text-muted-foreground">{statusText}</p></div>{depleted && <span className="inline-flex min-h-11 items-center rounded-xl bg-slate-500 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-white">VUOTA</span>}{editable && <button type="button" onClick={() => { void deleteCassa(group); }} disabled={savingId === `delete-${group.key}`} className="min-h-11 rounded-xl border border-rose-500/70 bg-rose-500/10 px-3 py-2 text-xs font-extrabold uppercase text-rose-600 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50">{savingId === `delete-${group.key}` ? 'Eliminazione...' : 'Elimina cassa'}</button>}{editable && group.operationalBalance > 0 && group.operationalBalance < 9 && <button type="button" onClick={() => { void zeroCassa(group); }} disabled={savingId === `zero-${group.key}`} className="min-h-11 rounded-xl border border-slate-400/70 bg-background/80 px-3 py-2 text-xs font-bold uppercase text-slate-600 transition hover:bg-slate-500/10 disabled:opacity-50">{savingId === `zero-${group.key}` ? 'Azzeramento...' : 'Azzera cassa'}</button>}{editable && group.operationalBalance > 0.3 && onAddDischarge && <button type="button" onClick={() => onAddDischarge(group.key)} className="min-h-11 rounded-xl border border-orange-400/70 bg-background/80 px-3 py-2 text-xs font-bold uppercase text-orange-500 transition hover:bg-orange-500/10">+ Scarico manuale</button>}</div></div>
        <div className="w-full overflow-hidden"><table className="matrix-table mobile-stack-table w-full table-fixed break-words text-left text-sm uppercase"><thead><tr className="border-b-2 border-primary/35 text-sm tracking-wide text-muted-foreground">{headers.map((label) => <th key={label} className="px-1 py-2 sm:px-2">{label}</th>)}</tr></thead><tbody>{group.loads.map((row) => renderRow(row, true, depleted))}{group.discharges.map((row) => renderRow(row, false, depleted))}</tbody></table></div>
      </section>;
    })}
  </div>;
}
