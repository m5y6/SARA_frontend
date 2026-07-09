import { useState } from 'react';
import fondoLogin from '../../imagenes/fondo-login.jpg';
import logoDuoc from '../../imagenes/logo-duoc.png';

export function LoginTab({ onLogin, authSession, onLogout }) {
  const [email, setEmail] = useState('admin@correo.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('El correo y la contraseña son obligatorios.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await onLogin({ email, password });
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo iniciar sesión. Revisa tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-end justify-center bg-ink-950 bg-cover bg-center p-4 sm:items-end sm:justify-end sm:p-10"
      style={{ backgroundImage: `url(${fondoLogin})` }}
    >
      {/* Overlay para legibilidad, más oscuro hacia la esquina donde va la card */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-ink-950/90 via-ink-950/30 to-transparent sm:from-ink-950/95 sm:via-ink-950/10" />

        {/* Logo institucional, esquina superior izquierda */}
      <div className="absolute left-6 top-6 sm:left-10 sm:top-10">
        <div className="rounded border-b-2 border-brand-yellow bg-white/6 px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <img src={logoDuoc} alt="DUOC UC" className="h-22 w-auto sm:h-16" />
        </div>
      </div>  

      {/* Card de login, esquina inferior derecha */}
      <section className="relative w-full max-w-sm rounded border border-ink-600 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-sm sm:p-7">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-yellow">
              Acceso institucional
            </p>
            <h2 className="text-xl font-semibold text-white">Iniciar sesión</h2>
          </div>
          {authSession ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded border border-ink-600 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-ink-600 hover:bg-ink-800"
            >
              Cerrar sesión
            </button>
          ) : null}
        </header>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 text-sm font-medium text-gray-400">
            Correo institucional
            <input
              className="w-full rounded border border-ink-600 bg-ink-950 px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/15 disabled:opacity-50"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              required
              aria-label="Correo"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-gray-400">
            Contraseña
            <input
              className="w-full rounded border border-ink-600 bg-ink-950 px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/15 disabled:opacity-50"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              required
              aria-label="Contraseña"
            />
          </label>

          {error ? (
            <p className="rounded border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 rounded border-l-4 border-brand-yellow bg-brand-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-gray-400"
          >
            {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        {authSession ? (
          <div className="mt-5 grid gap-1.5 rounded border border-ink-600 bg-ink-950 p-4">
            <h3 className="text-sm font-semibold text-white">Sesión guardada</h3>
            <p className="text-sm text-gray-400">{authSession.name} · {authSession.email}</p>
            <p className="text-sm text-gray-400">{authSession.role} · user_id {authSession.userId}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}