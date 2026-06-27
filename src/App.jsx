import { useEffect, useMemo, useState, startTransition } from 'react';
import { clearAuthSession, getStoredAuthSession, setStoredAuthSession } from './lib/authStorage';
import { loginRequest } from './api/auth';
import { healthCheck } from './api/system';
import { TabNav } from './components/TabNav';
import { ChatTab } from './components/tabs/ChatTab';
import { LoginTab } from './components/tabs/LoginTab';
import { UploadTab } from './components/tabs/UploadTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { RatingTab } from './components/tabs/RatingTab';
import { AdminTab } from './components/tabs/AdminTab';
import { DashboardTab } from './components/tabs/DashboardTab';
import { hasPermission, isAdminSession } from './lib/permissions';

const AUTH_INVALIDATED_EVENT = 'sara:auth-invalidated';

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
    { id: 'dashboard', label: 'Sistema' },
    { id: 'valoracion', label: 'Valoración' },
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

  if (isSessionVerifying) {
    return (
      <div className="app-shell app-shell-auth">
        <header className="app-header app-header-auth">
          <div className="brand-block">
            <div className="brand-mark">S</div>
            <div>
              <h1>SARA</h1>
              <p>Asistente Inteligente Duoc UC</p>
            </div>
          </div>
        </header>

        <main className="tab-stage auth-stage">
          <section className="panel-card panel-login">
            <header className="panel-head">
              <div>
                <p className="panel-kicker">Verificando sesión</p>
                <h2>Comprobando acceso con el backend</h2>
              </div>
            </header>
            <p className="profile-note-copy">Estamos validando el token guardado. Si ya no sirve, volverás al login.</p>
          </section>
        </main>
      </div>
    );
  }

  if (!authSession) {
    return (
      <div className="app-shell app-shell-auth">
        <header className="app-header app-header-auth">
          <div className="brand-block">
            <div className="brand-mark">S</div>
            <div>
              <h1>SARA</h1>
              <p>Asistente Inteligente Duoc UC</p>
            </div>
          </div>
        </header>

        <main className="tab-stage auth-stage">
          <LoginTab onLogin={handleLogin} authSession={authSession} onLogout={handleLogout} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <h1>SARA</h1>
            <p>Asistente Inteligente Duoc UC</p>
          </div>
        </div>
        <div className="user-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="user-chip">
            <span className="user-chip-label">Sesión</span>
            <strong>{authSession?.name ?? 'Invitado'}</strong>
            <span>{authSession?.role ?? 'Sin acceso'}</span>
            {authSession?.permisos ? <span>{JSON.stringify(authSession.permisos)}</span> : null}
          </div>
          <button className="button-subtle button-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <main className="tab-stage">
        {activeTab === 'chat' && <ChatTab authSession={authSession} />}
        {activeTab === 'upload' && <UploadTab authSession={authSession} />}
        {activeTab === 'perfil' && <ProfileTab authSession={authSession} />}
        {activeTab === 'valoracion' && <RatingTab />}
        {activeTab === 'admin' && <AdminTab authSession={authSession} />}
        {activeTab === 'dashboard' && <DashboardTab authSession={authSession} />}
      </main>
    </div>
  );
}