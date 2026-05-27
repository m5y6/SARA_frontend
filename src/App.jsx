import { useEffect, useMemo, useState, startTransition } from 'react';
import { clearAuthSession, getStoredAuthSession, setStoredAuthSession } from './lib/authStorage';
import { loginRequest } from './api/auth';
import { TabNav } from './components/TabNav';
import { ChatTab } from './components/tabs/ChatTab';
import { LoginTab } from './components/tabs/LoginTab';
import { UploadTab } from './components/tabs/UploadTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { RatingTab } from './components/tabs/RatingTab';
import { AdminTab } from './components/tabs/AdminTab';
import { DashboardTab } from './components/tabs/DashboardTab';
import { hasPermission, isAdminSession } from './lib/permissions';

function buildTabs(authSession) {
  return [
    { id: 'chat', label: 'Chat Asistente' },
    {
      id: 'upload',
      label: 'Subir TXT',
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
  const tabs = useMemo(() => buildTabs(authSession), [authSession]);

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

  const handleLogin = async ({ email, password }) => {
    const session = await loginRequest(email, password);
    setStoredAuthSession(session);
    setAuthSession(session);
    startTransition(() => setActiveTab('chat'));
    return session;
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthSession(null);
    startTransition(() => setActiveTab('chat'));
  };

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
        <div className="user-chip">
          <span className="user-chip-label">Sesión</span>
          <strong>{authSession?.name ?? 'Invitado'}</strong>
          <span>{authSession?.role ?? 'Sin acceso'}</span>
          {authSession?.permisos ? <span>{JSON.stringify(authSession.permisos)}</span> : null}
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