'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Alias used by the dashboard for the alert center. */
export default function AlertesRedirectPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/chef/alertes'); }, [router]);
  return <main style={{ padding: 32 }}>Ouverture des alertes…</main>;
}