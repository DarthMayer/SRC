import * as React from 'react';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { dateInputToRomeIso } from '../lib/rome-time';
import { createReservation } from '../services/magazzinoApi';

type Props = { code: string; denomination: string; kind: 'SILURI' | 'CASSE'; editable: boolean; onRefresh: () => Promise<void> };

type ReservationHttpError = { response?: { status?: number; data?: unknown } };

function reservationErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as ReservationHttpError).response;
    const payload = response?.data;
    const body = payload && typeof payload === 'object' ? payload as Record<string, unknown> : undefined;
    const message = [body?.message, body?.error, body?.detail].find((value) => typeof value === 'string' && value.trim());
    const status = response?.status ? `HTTP ${response.status}` : 'risposta del server';
    if (typeof message === 'string') return `Prenotazione rifiutata (${status}): ${message.replace(/\s+/g, ' ').slice(0, 240)}`;
    return `Prenotazione rifiutata (${status}). Riprova e comunica questo codice all’assistenza.`;
  }
  return error instanceof Error ? error.message : 'La prenotazione non è stata inserita.';
}

export function LoadReservationPanel({ code, denomination, kind, editable, onRefresh }: Props) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState('');
  const [priority, setPriority] = React.useState('3');
  const [saving, setSaving] = React.useState(false);
  const reserve = async () => {
    if (!editable || !code || !date || saving) return;
    const scheduledAt = dateInputToRomeIso(date);
    if (!scheduledAt) {
      toast.error('Inserisci una data valida per la prenotazione.');
      return;
    }
    setSaving(true);
    try {
      await createReservation({
        '/text': `Prenotazione ${kind} ${code}`,
        'Data scarico': scheduledAt,
        Codice: code,
        Denominazione: denomination,
        'Quantità TM': 310,
        'Stato scarico': 'programmato',
        'Priorità urgenza': priority,
      });
      setOpen(false); setDate(''); setPriority('3');
      toast.success(`Prenotazione ${code} registrata nel programma ${kind.toLowerCase()}.`);
      void onRefresh().catch(() => toast.error('Prenotazione registrata, ma non è stato possibile aggiornare la vista.'));
    } catch (error) {
      toast.error(reservationErrorMessage(error));
    } finally { setSaving(false); }
  };
  return <div className="mt-4 border-t border-border/60 pt-3">{!open ? <button type="button" disabled={!editable} onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/50 px-3 text-sm font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"><CalendarPlus size={16} />Prenota carico</button> : <div className="grid gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:grid-cols-2"><label className="space-y-1 text-xs font-semibold uppercase tracking-wide"><span>Data presunta ricarico</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm font-normal normal-case" /></label><label className="space-y-1 text-xs font-semibold uppercase tracking-wide"><span>Urgenza</span><select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm font-normal normal-case">{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{'★'.repeat(value)} {value}/5</option>)}</select></label><div className="flex items-end gap-2"><button type="button" disabled={!date || saving} onClick={() => { void reserve(); }} className="min-h-10 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? 'Salvo...' : 'Conferma'}</button><button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-lg border border-border px-3 text-sm font-semibold">Annulla</button></div></div>}</div>;
}
