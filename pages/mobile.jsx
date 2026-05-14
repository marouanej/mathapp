import React from 'react';
import Head from 'next/head';
import { signOut, useSession } from 'next-auth/react';
import { StudentPanel } from '../components/platform/StudentPanel';
import { useRoomsStore } from '../hooks/useRoomsStore';

export default function MobilePage() {
  const { status, data: session } = useSession();
  const { rooms, loading, error } = useRoomsStore();

  if (status === 'loading') {
    return (
      <main className="flex h-screen items-center justify-center bg-blue-50 text-blue-900">
        Chargement de la session...
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="flex h-screen items-center justify-center bg-blue-50 text-blue-900 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-blue-300 bg-white p-6 shadow-md text-center">
          <h1 className="text-2xl font-bold">Connexion requise</h1>
          <p className="mt-3 text-sm text-blue-500">
            Connecte-toi depuis <span className="font-mono">/signin</span> pour accéder à l’espace élève.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Espace élève - Maths 6P</title>
        <meta
          name="description"
          content="Espace élève en français avec salles, modules et questions à choix multiples."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-slate-100 text-slate-900">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-3 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Élève</p>
              <p className="text-sm font-black text-slate-900">{session.user.name}</p>
              <p className="text-xs text-slate-500">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/signin' })}
              className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl px-3 py-3">
          <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Bienvenue</p>
                <h1 className="mt-2 text-xl font-black text-slate-900">Prêt pour ton défi math ?</h1>
              </div>
              <div className="inline-flex rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">Interface élève</div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Progression rapide</p>
                <p className="mt-1 text-xs text-slate-500">Choisis une salle puis un module pour démarrer.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Mode jeu</p>
                <p className="mt-1 text-xs text-slate-500">Questions rapides et réponse par choix multiple.</p>
              </div>
            </div>
            {loading && <p className="mt-4 text-sm text-slate-500">Chargement des salles...</p>}
            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          </div>

          <div className="mt-4">
            <StudentPanel rooms={rooms} />
          </div>
        </div>
      </main>
    </>
  );
}