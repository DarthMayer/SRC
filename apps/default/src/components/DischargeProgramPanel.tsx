import * as React from 'react';
import { CalendarDays, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { dateInputToRomeIso } from '../lib/rome-time';
import { deleteReservation, field, formatMetricTons, selectValue, title, type NodeRow, updateReservation } from '../services/magazzinoApi';

type Props = { rows: NodeRow[]; mangimiRows: NodeRow[]; editable: boolean; onRefresh: () => Promise<void> };

function categoryFor(programRow: NodeRow, mangimiRows: NodeRow[]) {
  const code = String(field(programRow, '@sca02') ?? '').trim().toUpperCase();
  const catalogRow = mangimiRows.find((item) => String(field(item, '@cod01') ?? '').trim().toUpperCase() === code);
  const catalogCategory = selectValue(field(catalogRow, '@cat01')).toLowerCase();
  if (catalogCategory.includes('silur')) return 'SILURI';
  if (catalogCategory.includes('cass')) return 'CASSE';
  const rowLabel = title(programRow).toUpperCase();
  if (rowLabel.includes('SILURI')) return 'SILURI';
  if (rowLabel.includes('CASSE')) return 'CASSE';
  const legacyCategory = String(field(programRow, '@sca04') ?? '').trim().toLowerCase();
  return legacyCategory.includes('silur') ? 'SILURI' : 'CASSE';
}

function urgencyLevel(value: string) {
  const match = value.match(/[1-5]/);
  return match ? Number(match[0]) : 1;
}

function sortProgramRows(programRows: NodeRow[]) {
  return programRows.slice().sort((left, right) => {
    const leftDate = Date.parse(String(field(left, '@sca01') ?? ''));
    const rightDate = Date.parse(String(field(right, '@sca01') ?? ''));
    const dateOrder = (Number.isFinite(leftDate) ? leftDate : Number.MAX_SAFE_INTEGER) - (Number.isFinite(rightDate) ? rightDate : Number.MAX_SAFE_INTEGER);
    if (dateOrder !== 0) return dateOrder;
    return urgencyLevel(selectValue(field(right, '@sca07'))) - urgencyLevel(selectValue(field(left, '@sca07')));
  });
}

function Stars({ value }: { value: string }) {
  const count = urgencyLevel(value);
  return <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${count} stelle di urgenza`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < count ? 'currentColor' : 'none'} />)}</span>;
}

function ProgramTable({ titleText, rows, editable, onRefresh }: { titleText: string; rows: NodeRow[]; editable: boolean; onRefresh: () => Promise<void> }) {
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const saveDate = async (row: NodeRow, value: string) => {
    if (!editable || savingId || !value) return;
    const scheduledDate = dateInputToRomeIso(value);
    if (!scheduledDate) {
      toast.error('Inserisci una data valida per la programmazione.');
      return;
    }
    setSavingId(row.id);
    try {
      await updateReservation(row.id, { 'Data scarico': scheduledDate });
      toast.success('Data di programmazione aggiornata.');
      void onRefresh().catch(() => toast.error('Data aggiornata, ma non è stato possibile aggiornare la vista.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'La data di programmazione non è stata aggiornata.');
    } finally { setSavingId(null); }
  };
  const removeBooking = async (row: NodeRow) => {
    if (!editable || savingId) return;
    const code = String(field(row, '@sca02') ?? '').trim();
    if (!window.confirm(`Eliminare la prenotazione ${code || title(row)}? L'operazione non si può annullare.`)) return;
    setSavingId(row.id);
    try {
      await deleteReservation(row.id);
      toast.success('Prenotazione eliminata.');
      void onRefresh().catch(() => toast.error('Prenotazione eliminata, ma non è stato possibile aggiornare la vista.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'La prenotazione non è stata eliminata.');
    } finally { setSavingId(null); }
  };
  return <section className="rounded-2xl border border-border/70 bg-background/45 p-4"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pianificazione</p><h3 className="mt-1 text-lg font-semibold">{titleText}</h3></div><CalendarDays className="text-primary" /></div>{rows.length === 0 ? <p className="rounded-xl border border-dashed border-primary/25 p-4 text-sm text-muted-foreground">Nessun carico in programma.</p> : <div className="space-y-3">{rows.map((row) => { const code = String(field(row, '@sca02') ?? '').trim(); const date = String(field(row, '@sca01') ?? '').slice(0, 10); return <article key={row.id} className="rounded-xl border border-border/70 bg-card/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono font-bold text-primary">{code || title(row)}</p><p className="text-sm text-muted-foreground">{String(field(row, '@sca03') ?? '')}</p></div><Stars value={selectValue(field(row, '@sca07'))} /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-sm font-semibold tabular-nums">{formatMetricTons(field(row, '@sca05'))} TM · {selectValue(field(row, '@sca06')) || 'programmato'}</span><label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data prevista<input aria-label={`Data prevista ${code}`} type="date" value={date} disabled={!editable || savingId === row.id} onChange={(event) => { void saveDate(row, event.target.value); }} className="h-10 rounded-lg border border-input bg-background px-2 text-sm font-normal text-foreground" /></label>{editable && <button type="button" disabled={savingId === row.id} onClick={() => { void removeBooking(row); }} aria-label={`Elimina prenotazione ${code}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-500/50 px-3 text-xs font-semibold text-rose-600 disabled:opacity-50"><Trash2 size={14} />Elimina prenotazione</button>}</div></article>; })}</div>}</section>;
}

export function DischargeProgramPanel({ rows, mangimiRows, editable, onRefresh }: Props) {
  const siluri = sortProgramRows(rows.filter((row) => categoryFor(row, mangimiRows) === 'SILURI'));
  const casse = sortProgramRows(rows.filter((row) => categoryFor(row, mangimiRows) === 'CASSE'));
  return <CardShell><ProgramTable titleText="PROGRAMMA SILURI" rows={siluri} editable={editable} onRefresh={onRefresh} /><ProgramTable titleText="PROGRAMMA CASSE" rows={casse} editable={editable} onRefresh={onRefresh} /></CardShell>;
}

function CardShell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-4"><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">Carichi in programma</p><p className="mt-1 text-sm text-muted-foreground">Admin e Staff possono modificare la data anche dopo la conferma. Le stelle indicano l’urgenza da 1 a 5.</p></div><div className="grid gap-4 lg:grid-cols-2">{children}</div></div>;
}
