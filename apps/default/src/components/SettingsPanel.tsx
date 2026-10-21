import * as React from 'react';
import { Bell, LockKeyhole, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from 'react-oidc-context';
import { createNode, field, PROJECTS, selectValue, type NodeRow, updateNode } from '../services/magazzinoApi';

type SettingsPanelProps = {
  currentEmail: string;
  currentName: string;
  userRole: string;
  isAdmin: boolean;
  editable: boolean;
  settingsRows: NodeRow[];
  backupRows?: NodeRow[];
  inventory?: Record<string, NodeRow[]>;
  onRefresh: () => Promise<void>;
  onSaveName: (name: string) => Promise<void>;
};

type FlagKey = 'email' | 'inventario' | 'push';
const flagFields: Record<FlagKey, string> = { email: '@set04', inventario: '@set06', push: '@set07' };
const flagLabels: Record<FlagKey, string> = { email: 'Notifiche email per carichi e scarichi', inventario: 'Notifiche Inventario di fine giornata', push: 'Notifiche push nell’app' };

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`flex min-h-11 w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${checked ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-border bg-background/50'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}><span className="font-medium">{label}</span><span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${checked ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>{checked ? 'ON' : 'OFF'}</span></button>;
}

export function SettingsPanel({ currentEmail, currentName, userRole, editable, settingsRows, onRefresh, onSaveName }: SettingsPanelProps) {
  const auth = useAuth();
  const settingsRow = settingsRows.find((row) => String(field(row, '@set01') ?? '').trim().toLowerCase() === currentEmail.trim().toLowerCase());
  const [flags, setFlags] = React.useState<Record<FlagKey, boolean>>({ email: true, inventario: true, push: true });
  const [saving, setSaving] = React.useState(false);
  const [profileName, setProfileName] = React.useState(currentName);
  const [savingProfile, setSavingProfile] = React.useState(false);

  React.useEffect(() => setProfileName(currentName), [currentName]);

  React.useEffect(() => {
    if (!settingsRow) return;
    setFlags({ email: selectValue(field(settingsRow, '@set04')).toLowerCase() !== 'off', inventario: selectValue(field(settingsRow, '@set06')).toLowerCase() !== 'off', push: selectValue(field(settingsRow, '@set07')).toLowerCase() !== 'off' });
  }, [settingsRow]);

  const saveFlag = async (key: FlagKey, next: boolean) => {
    if (!editable || saving) return;
    setFlags((current) => ({ ...current, [key]: next }));
    setSaving(true);
    try {
      const nextValue = next ? 'on' : 'off';
      if (settingsRow) {
        const values: Record<string, unknown> = { [`/attributes/${flagFields[key]}`]: nextValue, '/attributes/@set08': new Date().toISOString() };
        if (key === 'email') values['/attributes/@set05'] = nextValue;
        await updateNode(PROJECTS.impostazioni, settingsRow.id, values);
      } else {
        await createNode(PROJECTS.impostazioni, { '/text': `Impostazioni ${currentEmail}`, '/attributes/@set01': currentEmail, '/attributes/@set02': currentName || currentEmail, '/attributes/@set03': userRole || 'lettura', '/attributes/@set04': key === 'email' ? nextValue : 'on', '/attributes/@set05': key === 'email' ? nextValue : 'on', '/attributes/@set06': key === 'inventario' ? nextValue : 'on', '/attributes/@set07': key === 'push' ? nextValue : 'on', '/attributes/@set08': new Date().toISOString() });
      }
      toast.success(`${flagLabels[key]}: ${next ? 'ON' : 'OFF'}`);
      await onRefresh();
    } catch {
      setFlags((current) => ({ ...current, [key]: !next }));
      toast.error('Impostazione non salvata.');
    } finally {
      setSaving(false);
    }
  };

  const saveProfileName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editable) return;
    const nextName = profileName.trim();
    if (!nextName) {
      toast.error('Inserisci un nome valido.');
      return;
    }
    if (nextName === currentName.trim()) return;
    setSavingProfile(true);
    try {
      await onSaveName(nextName);
      toast.success('Nome account aggiornato.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Il nome account non è stato aggiornato.');
    } finally {
      setSavingProfile(false);
    }
  };
  const startPasswordChange = () => {
    if (!editable) return;
    void auth.signoutRedirect().catch(() => toast.error('Apri la schermata di accesso per gestire la password.'));
  };

  return <div className="space-y-6"><Card className="border-primary/25 bg-primary/5"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 text-primary" /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sicurezza · Il tuo account</p><h2 className="mt-1 text-xl font-semibold">Profilo personale</h2><p className="mt-1 text-sm text-muted-foreground">La password è gestita dal servizio di accesso e non è visibile né salvata nel gestionale.</p></div></div><form onSubmit={saveProfileName} className="mt-4 grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-semibold"><span>Nome utente</span><input disabled={!editable} value={profileName} onChange={(event) => setProfileName(event.target.value)} autoComplete="name" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" /></label><label className="space-y-1 text-sm font-semibold"><span>Email, non modificabile</span><input value={currentEmail} readOnly aria-readonly="true" className="h-11 w-full rounded-xl border border-input bg-muted px-3 font-normal text-muted-foreground" /></label><p className="text-sm text-muted-foreground sm:col-span-2">Ruolo attuale: {userRole.toUpperCase()}</p><div className="flex flex-wrap gap-2 sm:col-span-2"><button type="submit" disabled={!editable || savingProfile || !profileName.trim()} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{savingProfile ? 'Salvataggio...' : 'Salva nome'}</button><button type="button" disabled={!editable} onClick={startPasswordChange} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent">Gestisci password dall’accesso</button></div></form><p className="mt-3 text-xs text-muted-foreground">Per cambiare password, esci e usa la procedura ufficiale nella schermata di accesso. L’amministratore non può leggerla.</p></Card><Card><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Preferenze personali</p><h2 className="mt-1 text-2xl font-semibold">IMPOSTAZIONI</h2><p className="mt-2 text-sm text-muted-foreground">Le preferenze sono salvate per l’account {currentEmail}.</p></div><Settings2 className="text-primary" /></div><div className="mt-5 grid gap-3 md:grid-cols-2">{(Object.keys(flagLabels) as FlagKey[]).map((key) => <Toggle key={key} checked={flags[key]} onChange={(next) => { void saveFlag(key, next); }} label={flagLabels[key]} disabled={!editable || saving} />)}</div>{saving && <p className="mt-3 text-xs text-muted-foreground">Salvataggio in corso...</p>}</Card><Card className="border-primary/20 bg-primary/5"><div className="flex items-start gap-3"><Bell className="mt-0.5 text-primary" /><div><h2 className="font-semibold">Notifiche inventario di fine giornata</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Quando attivate, riceverai il riepilogo dell’ultima giacenza generata alle 19:00. I backup e i punti di ripristino non sono disponibili in questa sezione.</p></div></div></Card></div>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`neon-panel rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur ${className}`}>{children}</section>;
}
