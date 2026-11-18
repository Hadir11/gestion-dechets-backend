'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import { authService } from '../../../services/auth-service';

type Employee = { nom?: string; prenom?: string; role?: string; roleCode?: string; email?: string; telephone?: string; disponible?: boolean };
const roles = [
  { code: 'AGENT', label: 'Agent de collecte' },
  { code: 'CHEF_EQUIPE', label: 'Chef d’équipe' },
  { code: 'ADMIN', label: 'Administrateur' },
  { code: 'TECHNICIEN', label: 'Technicien' },
  { code: 'RECYCLAGE', label: 'Responsable recyclage' },
];

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [form, setForm] = useState({ nom: '', prenom: '', role: '', roleCode: 'AGENT', email: '', telephone: '', disponible: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const employee = await authService.authFetch<Employee>('/employes/' + encodeURIComponent(id));
        const roleCode = employee.roleCode || 'AGENT';
        setForm({ nom: employee.nom || '', prenom: employee.prenom || '', role: employee.role || '', roleCode, email: employee.email || '', telephone: employee.telephone || '', disponible: Boolean(employee.disponible) });
      } catch (e) { setError(e instanceof Error ? e.message : 'Chargement impossible.'); }
      finally { setLoading(false); }
    }
    void load();
  }, [id]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const role = roles.find((item) => item.code === form.roleCode)?.label || form.role;
      await authService.authFetch('/employes/' + encodeURIComponent(id), {
        method: 'PUT',
        body: JSON.stringify({ nom: form.nom, prenom: form.prenom, role, roleCode: form.roleCode, email: form.email, telephone: form.telephone, disponible: form.disponible }),
      });
      router.push('/employes/' + encodeURIComponent(id));
    } catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  }

  return <AuthGuard requiredRole="ADMIN"><main className="mx-auto max-w-3xl">
    <Link href={'/employes/' + encodeURIComponent(id)} className="text-sm font-semibold text-slate-600 hover:text-blue-700">← Retour au dossier</Link>
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h1 className="text-2xl font-bold text-slate-950">Modifier un employé</h1><p className="mt-2 text-sm text-slate-500">Mettez à jour les coordonnées, le rôle et la disponibilité.</p>
      {loading ? <p className="mt-6 text-sm text-slate-500">Chargement…</p> : <form onSubmit={save} className="mt-6 grid gap-5 sm:grid-cols-2">
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 sm:col-span-2">{error}</p>}
        {([
          ['Prénom', 'prenom', 'text'],
          ['Nom', 'nom', 'text'],
          ['Courriel', 'email', 'email'],
          ['Téléphone', 'telephone', 'tel'],
        ] as const).map(([label, key, type]) => <label key={key} className="text-sm font-semibold text-slate-700">{label}<input required={key === 'nom' || key === 'prenom'} type={type} value={form[key]} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>)}
        <label className="text-sm font-semibold text-slate-700">Rôle<select value={form.roleCode} onChange={(e) => setForm((old) => ({ ...old, roleCode: e.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal">{roles.map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}</select></label>
        <label className="flex items-center gap-3 self-end rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.disponible} onChange={(e) => setForm((old) => ({ ...old, disponible: e.target.checked }))} className="h-4 w-4 accent-blue-600" />Disponible pour les missions</label>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end"><Link href={'/employes/' + encodeURIComponent(id)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Annuler</Link><button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer'}</button></div>
      </form>}
    </section>
  </main></AuthGuard>;
}
