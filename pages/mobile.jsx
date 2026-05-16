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
      <main className="safe-x safe-y flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        Chargement de la session...
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="safe-x safe-y flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-4 text-center shadow-sm">
          <h1 className="text-xl font-black">Connexion requise</h1>
          <p className="mt-2 text-sm text-slate-500">
            Connecte-toi depuis <span className="font-mono">/signin</span> pour
            accéder à l’espace élève.
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

      <main className="safe-bottom min-h-screen bg-transparent text-slate-900">
        <div className="safe-top safe-x sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mobile-shell flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">
                Élève
              </p>
              <p className="truncate text-sm font-black text-slate-900">
                {session.user.name}
              </p>
              <p className="truncate text-xs text-slate-500">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/signin' })}
              className="shrink-0 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="safe-x">
          <div className="mobile-shell py-2.5">
            <div className="rounded-[28px] border border-slate-200 bg-white/95 p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">
                    Bienvenue
                  </p>
                  <h1 className="mt-1.5 text-lg font-black text-slate-900 sm:text-xl">
                    Prêt pour ton défi math ?
                  </h1>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choisis une salle, entre dans un module et lance une partie
                    en quelques secondes.
                  </p>
                </div>
                <div className="inline-flex w-fit rounded-2xl bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                  Interface élève
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Progression rapide
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choisis une salle puis un module pour démarrer.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Mode jeu
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Questions rapides et réponse par choix multiple.
                  </p>
                </div>
              </div>
              {loading && (
                <p className="mt-3 text-sm text-slate-500">
                  Chargement des salles...
                </p>
              )}
              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            </div>

            <div className="mt-2">
              <StudentPanel rooms={rooms} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
