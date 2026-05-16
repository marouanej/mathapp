import React, { useMemo } from 'react';
import Head from 'next/head';
import { signOut, useSession } from 'next-auth/react';
import { TeacherPanel } from '../components/platform/TeacherPanel';
import { useRoomsStore } from '../hooks/useRoomsStore';

export default function AdminPage() {
  const { status, data: session } = useSession();
  const {
    rooms,
    loading,
    error,
    createRoom,
    createModule,
    saveQuestion,
    deleteQuestion,
    moveQuestion,
    deleteRoom,
    deleteModule,
  } = useRoomsStore();

  const stateJson = useMemo(() => JSON.stringify(rooms, null, 2), [rooms]);

  if (status === 'loading') {
    return (
      <main className="safe-x safe-y min-h-screen bg-slate-100 text-slate-900">
        Chargement de la session...
      </main>
    );
  }

  if (!session?.user || session.user.role !== 'maitre') {
    return (
      <main className="safe-x safe-y min-h-screen bg-slate-100 text-slate-900">
        <div className="mobile-shell rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h1 className="text-2xl font-black">Acces reserve au maitre</h1>
          <p className="mt-2 text-sm text-slate-500">
            Connecte-toi avec un compte maitre depuis `/signin`.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Espace admin - Mathématiques 6P</title>
        <meta
          name="description"
          content="Espace maître pour créer les salles, les modules et les questions de mathématiques."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="safe-bottom min-h-screen bg-transparent py-2 text-slate-900 sm:py-3">
        <div className="safe-x">
          <div className="mobile-shell space-y-3">
            <div className="rounded-[28px] border border-slate-200 bg-white/95 p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-semibold">
                    Tableau de bord
                  </p>
                  <h1 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                    Espace maître
                  </h1>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Créez et organisez les salles, les modules et les questions
                    de votre parcours mathématique.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/signin' })}
                  className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
                >
                  Déconnexion
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-semibold">
                    Utilisateur
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                    {session.user.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {session.user.email}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-semibold">
                    Statut
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    Connecté en tant que maître
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Accès complet aux outils de création.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/95 p-3 shadow-sm sm:p-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-semibold">
                État base de données
              </p>
              {loading && (
                <p className="mt-3 text-sm text-slate-500">
                  Chargement des salles...
                </p>
              )}
              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
              {!loading && !error && (
                <pre className="mt-3 max-h-36 overflow-auto rounded-2xl bg-slate-950/95 p-3 text-xs text-slate-100">
                  {stateJson}
                </pre>
              )}
            </div>

            <section className="rounded-[28px] border border-slate-200 bg-white/95 p-3 shadow-sm sm:p-4">
              <TeacherPanel
                rooms={rooms}
                onCreateRoom={createRoom}
                onCreateModule={createModule}
                onSaveQuestion={saveQuestion}
                onDeleteQuestion={deleteQuestion}
                onMoveQuestion={moveQuestion}
                onDeleteRoom={deleteRoom}
                onDeleteModule={deleteModule}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
