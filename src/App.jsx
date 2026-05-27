import { useEffect, useMemo, useState, startTransition } from 'react';
import { clearAuthSession, getStoredAuthSession, setStoredAuthSession } from './lib/authStorage';
import { loginRequest } from './api/auth';
import { TabNav } from './components/TabNav';
import { ChatTab } from './components/tabs/ChatTab';
import { LoginTab } from './components/tabs/LoginTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { RatingTab } from './components/tabs/RatingTab';
import { AdminTab } from './components/tabs/AdminTab';
import { DashboardTab } from './components/tabs/DashboardTab';

const tabs = [
  { id: 'chat', label: 'Chat Asistente' },
  { id: 'login', label: 'Login' },
  { id: 'perfil', label: 'Mi Perfil' },
  { id: 'valoracion', label: 'Valoración' },
  { id: 'admin', label: 'Admin (Carga S3)' },
  { id: 'dashboard', label: 'Dashboard Precisión' },
];

export default function App() {
  const storedSession = useMemo(() => getStoredAuthSession(), []);
  const [activeTab, setActiveTab] = useState('chat');
  const [authSession, setAuthSession] = useState(storedSession);

  useEffect(() => {
    if (storedSession) {
      setAuthSession(storedSession);
    }
  }, [storedSession]);

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
  };

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
        </div>
      </header>

      <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <main className="tab-stage">
        {activeTab === 'chat' && <ChatTab authSession={authSession} />}
        {activeTab === 'login' && <LoginTab onLogin={handleLogin} authSession={authSession} onLogout={handleLogout} />}
        {activeTab === 'perfil' && <ProfileTab authSession={authSession} />}
        {activeTab === 'valoracion' && <RatingTab />}
        {activeTab === 'admin' && <AdminTab authSession={authSession} />}
        {activeTab === 'dashboard' && <DashboardTab authSession={authSession} />}
      </main>
    </div>
  );
}