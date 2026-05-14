import React, { useState } from 'react';
import Head from 'next/head';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

const EMPTY_REGISTER = {
  name: '',
  email: '',
  password: '',
  role: 'eleve',
};

const getDefaultRouteForRole = (role) =>
  role === 'maitre' ? '/admin' : '/mobile';

const getSafeRedirect = (callbackUrl, role) => {
  if (!callbackUrl || !callbackUrl.startsWith('/')) {
    return getDefaultRouteForRole(role);
  }

  if (['/', '/signin', '/mobile', '/admin'].includes(callbackUrl)) {
    return getDefaultRouteForRole(role);
  }

  return callbackUrl;
};

export default function SignInPage() {
  const router = useRouter();
  const [showRegister, setShowRegister] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');

    const response = await signIn('credentials', {
      email: loginForm.email,
      password: loginForm.password,
      redirect: false,
    });

    if (response?.error) {
      setLoginError('Identifiants invalides.');
      return;
    }

    const currentSession = await getSession();
    const role = currentSession?.user?.role;
    const callbackUrl =
      typeof router.query.callbackUrl === 'string'
        ? router.query.callbackUrl
        : '';
    router.replace(getSafeRedirect(callbackUrl, role));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerForm),
    });

    const payload = await response.json();

    if (!response.ok) {
      setRegisterError(payload.error || 'Impossible de creer le compte.');
      return;
    }

    setRegisterSuccess('Compte cree. Connecte-toi maintenant.');
    setRegisterForm(EMPTY_REGISTER);
    setShowRegister(false);
  };

  return (
    <>
      <Head>
        <title>Connexion - Plateforme educative</title>
      </Head>

      <main className="min-h-screen bg-slate-100 px-4 py-4 flex items-center justify-center">
        <div className="w-full max-w-[380px] space-y-4">
          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-sm">
                <span className="text-xl font-black">M</span>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500 font-semibold">Math app</p>
                <h1 className="mt-1 text-xl font-black text-slate-900">Connexion</h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-5 text-slate-500">Connectez-vous pour accéder à vos salles et modules de mathématiques.</p>
          </section>

          <section className="rounded-[28px] bg-white p-4 shadow-sm border border-slate-200">
            <form className="space-y-3" onSubmit={handleLogin}>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((c) => ({ ...c, email: e.target.value }))
                  }
                  autoFocus
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                  placeholder="exemple@mail.com"
                />
              </div>

              <div className="relative">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="login-password">
                  Mot de passe
                </label>
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((c) => ({ ...c, password: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((value) => !value)}
                  className="absolute right-3 top-[50%] -translate-y-1/2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  {showLoginPassword ? 'Cacher' : 'Voir'}
                </button>
              </div>

              {loginError && <p className="text-sm text-red-500">{loginError}</p>}

              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Se connecter
              </button>
            </form>

            <div className="mt-3 border-t border-slate-200 pt-3 text-center">
              <p className="text-sm text-slate-500">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  className="font-semibold text-slate-900 underline-offset-2 hover:text-slate-700"
                  onClick={() => setShowRegister(true)}
                >
                  Inscrivez-vous
                </button>
              </p>
            </div>
          </section>
        </div>

        {showRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
            <div className="w-full max-w-[380px] rounded-[28px] bg-white p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500 font-semibold">Inscription</p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">Créer un compte</h2>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  onClick={() => setShowRegister(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              <form className="mt-3 space-y-3" onSubmit={handleRegister}>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="register-name">
                    Nom complet
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    value={registerForm.name}
                    onChange={(e) =>
                      setRegisterForm((c) => ({ ...c, name: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="register-email">
                    Email
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm((c) => ({ ...c, email: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                    placeholder="exemple@mail.com"
                  />
                </div>

                <div className="relative">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="register-password">
                    Mot de passe
                  </label>
                  <input
                    id="register-password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm((c) => ({ ...c, password: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((value) => !value)}
                    className="absolute right-3 top-[50%] -translate-y-1/2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    {showRegisterPassword ? 'Cacher' : 'Voir'}
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="register-role">
                    Rôle
                  </label>
                  <select
                    id="register-role"
                    value={registerForm.role}
                    onChange={(e) =>
                      setRegisterForm((c) => ({ ...c, role: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                  >
                    <option value="eleve">Élève</option>
                    <option value="maitre">Maître</option>
                  </select>
                </div>

                {registerError && <p className="text-sm text-red-500">{registerError}</p>}
                {registerSuccess && <p className="text-sm text-emerald-600">{registerSuccess}</p>}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Créer un compte
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
