import { useEffect, useMemo, useState, startTransition } from 'react';
import { clearAuthSession, getStoredAuthSession, setStoredAuthSession } from './lib/authStorage';
import { loginRequest } from './api/auth';
import { healthCheck } from './api/system';
import { TabNav } from './components/TabNav';
import { ChatTab } from './components/tabs/ChatTab';
import { LoginTab } from './components/tabs/LoginTab';
import { UploadTab } from './components/tabs/UploadTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { AdminTab } from './components/tabs/AdminTab';
import { hasPermission, isAdminSession } from './lib/permissions';
import logoDuoc from './imagenes/logo-duoc.png';
import fondoChat from './imagenes/fondo-chat.jpg';
import fondoAdmin from './imagenes/fondo-admin.jpg';
import fondoPerfil from './imagenes/fondo-perfil.jpg';
import fondoSubir from './imagenes/fondo-subir.jpg';

const AUTH_INVALIDATED_EVENT = 'sara:auth-invalidated';

const TAB_BACKGROUNDS = {
  chat: {
    backgroundImage: `url(${fondoChat})`,
    backgroundColor: '#030712',
  },
  upload: {
    backgroundImage: `url(${fondoSubir})`,
    backgroundColor: '#030712',
  },
  perfil: {
    backgroundImage: `url(${fondoPerfil})`,
    backgroundColor: '#020617',
  },
  admin: {
    backgroundImage: `url(${fondoAdmin})`,
    backgroundColor: '#020617',
  },
};

function buildTabs(authSession) {
  return [
    { id: 'chat', label: 'Chat Asistente' },
    {
      id: 'upload',
      label: 'Subir Documento',
      hidden: !(isAdminSession(authSession) || hasPermission(authSession?.permisos, 'upload')),
    },
    {
      id: 'admin',
      label: 'Administración',
      hidden: !isAdminSession(authSession),
    },
    { id: 'perfil', label: 'Mi Perfil' },
  ].filter((tab) => !tab.hidden);
}

export default function App() {
  const storedSession = useMemo(() => getStoredAuthSession(), []);
  const [activeTab, setActiveTab] = useState('chat');
  const [authSession, setAuthSession] = useState(storedSession);
  const [isSessionVerifying, setIsSessionVerifying] = useState(Boolean(storedSession));
  const tabs = useMemo(() => buildTabs(authSession), [authSession]);

  function handleLogout() {
    clearAuthSession();
    setAuthSession(null);
    setIsSessionVerifying(false);
    startTransition(() => setActiveTab('chat'));
  }

  useEffect(() => {
    if (storedSession) {
      setAuthSession(storedSession);
    }
  }, [storedSession]);

  useEffect(() => {
    if (authSession && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab('chat');
    }
  }, [activeTab, authSession, tabs]);

  useEffect(() => {
    const handleAuthInvalidated = () => {
      handleLogout();
    };

    window.addEventListener(AUTH_INVALIDATED_EVENT, handleAuthInvalidated);
    return () => window.removeEventListener(AUTH_INVALIDATED_EVENT, handleAuthInvalidated);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function verifyStoredSession() {
      if (!storedSession) {
        setIsSessionVerifying(false);
        return;
      }

      try {
        await healthCheck();
        if (!isCancelled) {
          setIsSessionVerifying(false);
        }
      } catch (requestError) {
        const status = requestError?.response?.status;
        if (status === 401 || status === 403) {
          if (!isCancelled) {
            handleLogout();
          }
          return;
        }

        if (!isCancelled) {
          setIsSessionVerifying(false);
        }
      }
    }

    verifyStoredSession();

    return () => {
      isCancelled = true;
    };
  }, [handleLogout, storedSession]);

  const handleLogin = async ({ email, password }) => {
    const session = await loginRequest(email, password);
    setStoredAuthSession(session);
    setAuthSession(session);
    startTransition(() => setActiveTab('chat'));
    return session;
  };

  // Estado: verificando sesión guardada — pantalla completa, sin banner, misma identidad del login
  if (isSessionVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 p-4">
        <section className="grid w-full max-w-4xl overflow-hidden rounded border border-ink-600 md:grid-cols-2">
          <div className="relative hidden flex-col justify-between bg-brand-blue-darker p-10 md:flex">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-brand-yellow text-sm font-bold text-ink-950">
                  S
                </div>
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-white">
                  DUOC UC
                </span>
              </div>
              <h1 className="text-2xl font-semibold leading-snug text-white">
                Asistente institucional SARA
              </h1>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-blue-100/70">
                Plataforma de apoyo académico. Consulta información institucional
                y resuelve dudas de forma directa y confiable.
              </p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-blue-100/50">
                Acceso restringido a personal y estudiantes autorizados.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start justify-center gap-3 bg-ink-900 p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-yellow">
              Verificando sesión
            </p>
            <h2 className="text-xl font-semibold text-white">
              Comprobando acceso con el backend
            </h2>
            <p className="text-sm text-gray-400">
              Estamos validando el token guardado. Si ya no es válido, volverás al login.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // Estado: sin sesión — el propio LoginTab ocupa toda la pantalla, sin header adicional
  if (!authSession) {
    return <LoginTab onLogin={handleLogin} authSession={authSession} onLogout={handleLogout} />;
  }

  // Estado: autenticado — header actualizado a la paleta institucional
  const activeTabBackground = TAB_BACKGROUNDS[activeTab] ?? TAB_BACKGROUNDS.chat;

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={activeTabBackground}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-ink-950/85 via-ink-950/35 to-transparent" />

      <div className="relative z-10 mx-auto mt-2.5 mb-10 w-[min(100%-18px,1280px)] sm:mt-6 sm:w-[min(1280px,calc(100%-32px))]">
        <header className="relative overflow-hidden rounded-lg bg-ink-800 shadow-md shadow-black/20">
        {/* Línea de acento superior, degradado institucional */}
        <div className="h-[3px] w-full bg-gradient-to-r from-brand-yellow via-brand-yellow to-brand-blue" />

        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          {/* Zona de identidad */}
          <div className="flex items-center gap-4">
            <div className="rounded-md border-b-2 border-brand-yellow bg-white/8 px-3 py-2 shadow-sm">
              <img src={logoDuoc} alt="DUOC UC" className="h-7 w-auto sm:h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="m-0 text-base font-semibold tracking-[0.02em] text-white sm:text-lg">
                  SARA
                </h1>
              </div>
              <p className="m-0 text-xs uppercase tracking-[0.06em] text-gray-400">
                Asistente Inteligente · Duoc UC
              </p>
            </div>
          </div>

          {/* Zona de usuario + acción */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-md bg-ink-700 py-2 pl-2 pr-3.5">
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-brand-yellow text-xs font-bold text-ink-950">
                {(authSession?.name ?? 'IN').slice(0, 2).toUpperCase()}
              </div>
              <div className="grid gap-0.5 text-left">
                <strong className="text-sm font-semibold leading-none text-white">
                  {authSession?.name ?? 'Invitado'}
                </strong>
                <span className="text-xs leading-none text-gray-400">
                  {authSession?.role ?? 'Sin acceso'}
                </span>
              </div>
            </div>

            <button
              className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-700 px-4 text-sm font-medium text-gray-300 transition-colors hover:bg-red-500/15 hover:text-red-300"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        </header>

        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <main className="pt-3.5">
          {activeTab === 'chat' && <ChatTab authSession={authSession} />}
          {activeTab === 'upload' && <UploadTab authSession={authSession} />}
          {activeTab === 'perfil' && <ProfileTab authSession={authSession} />}
          {activeTab === 'admin' && <AdminTab authSession={authSession} />}
        </main>
      </div>
    </div>
  );
}