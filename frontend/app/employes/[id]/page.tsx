'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthGuard from '../../components/AuthGuard';
import { authService } from '../../services/auth-service';

type Employee = { _id?: string; id?: string; nom?: string; prenom?: string; role?: string; roleCode?: string; email?: string; telephone?: string; username?: string; disponible?: boolean; enabled?: boolean };

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try { setEmployee(await authService.authFetch<Employee>('/employes/' + encodeURIComponent(id))); }
      catch (e) { setError(e instanceof Error ? e.message : 'Chargement impossible.'); }
      finally { setLoading(false); }
    }
    void load();
  }, [id]);

  return <AuthGuard requiredRole="ADMIN"><main className="mx-auto max-w-4xl">
    <Link href="/employes/liste" className="text-sm font-semibold text-slate-600 hover:text-blue-700">← Retour à la liste</Link>
    {loading ? <div className="mt-5 rounded-2xl border bg-white p-8 text-slate-500">Chargement…</div>
    : error || !employee ? <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">{error || 'Employé introuvable.'}</div>
    : <article className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col justify-between gap-4 border-b bg-blue-50/60 p-6 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Dossier du personnel</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{employee.prenom} {employee.nom}</h1><p className="mt-1 text-sm text-slate-500">{employee.role || employee.roleCode || 'Rôle non défini'}</p></div>
        <Link href={'/employes/' + encodeURIComponent(id) + '/modifier'} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Modifier le dossier</Link>
      </header>
      <dl className="grid gap-px bg-slate-100 sm:grid-cols-2">
        {[
          ['Identifiant', employee.username || '—'],
          ['Rôle', employee.roleCode || employee.role || '—'],
          ['Courriel', employee.email || '—'],
          ['Téléphone', employee.telephone || '—'],
          ['Disponibilité', employee.disponible ? 'Disponible' : 'Indisponible'],
          ['Compte', employee.enabled === false ? 'Désactivé' : 'Actif'],
        ].map(([label, value]) => <div key={label} className="bg-white p-5"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-2 break-words text-sm font-semibold text-slate-900">{value}</dd></div>)}
      </dl>
    </article>}
  </main></AuthGuard>;
}
