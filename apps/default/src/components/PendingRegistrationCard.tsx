import * as React from 'react';
import { LockKeyhole, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createNode, PROJECTS } from '../services/magazzinoApi';

type Props = {
  email: string;
  onSubmitted: () => Promise<void>;
};

export function PendingRegistrationCard({ email, onSubmitted }: Props) {
  const [presentation, setPresentation] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = presentation.trim();
    if (!email || !text || saving) return;
    setSaving(true);
    try {
      await createNode(PROJECTS.utenti, {
        '/text': `${email} - Richiesta di accesso`,
        '/attributes/@usr01': email,
        '/attributes/@usr02': email.split('@')[0],
        '/attributes/@usr03': 'in-attesa',
        '/attributes/@usr04': 'ospite',
        '/attributes/@usr05': text,
      });
      toast.success('Richiesta inviata. Attendi l’approvazione del titolare.');
      await onSubmitted();
    } catch {
      toast.error('La richiesta non è stata inviata. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="flex min-h-screen items-center justify-center bg-background p-6"><section className="neon-panel w-full max-w-xl rounded-2xl border border-primary/30 bg-card/90 p-6 shadow-xl sm:p-8"><div className="flex items-start gap-4"><span className="rounded-2xl bg-primary/15 p-3 text-primary"><LockKeyhole size={28} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Prima registrazione</p><h1 className="mt-1 text-2xl font-semibold">Presentati al team GALTIERI</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">L’accesso viene approvato manualmente. Scrivi una breve presentazione per aiutare il titolare a riconoscere la richiesta.</p></div></div><form onSubmit={submit} className="mt-6 space-y-4"><label className="block space-y-2 text-sm font-semibold"><span>Email registrata</span><input value={email} readOnly aria-readonly="true" className="h-11 w-full rounded-xl border border-input bg-muted px-3 text-muted-foreground" /></label><label className="block space-y-2 text-sm font-semibold"><span>Breve presentazione</span><textarea required minLength={10} value={presentation} onChange={(event) => setPresentation(event.target.value)} placeholder="Nome, azienda o reparto e motivo della richiesta" className="min-h-32 w-full rounded-xl border border-input bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><button type="submit" disabled={saving || presentation.trim().length < 10} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Invio in corso...' : 'Invia richiesta di accesso'}<Send size={17} /></button></form></section></div>;
}
