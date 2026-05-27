export function ProfileTab({ authSession }) {
  const profileRows = authSession
    ? [
        { label: 'Usuario', value: authSession.name },
        { label: 'Correo', value: authSession.email },
        { label: 'Rol', value: authSession.role },
        { label: 'ID', value: authSession.userId },
      ]
    : [
        { label: 'Usuario', value: 'Invitado' },
        { label: 'Correo', value: 'No autenticado' },
        { label: 'Rol', value: 'Sin sesión' },
        { label: 'ID', value: '-' },
      ];

  return (
    <section className="panel-card">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Mi perfil</p>
          <h2>Datos de sesión y contexto</h2>
        </div>
        <div className="status-pill">{authSession ? 'Con token' : 'Sin token'}</div>
      </header>

      <div className="profile-grid">
        {profileRows.map((row) => (
          <div key={row.label} className="profile-card">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>

      <div className="profile-note">
        <h3>Uso esperado</h3>
        <p>
          El token se guarda en localStorage y se reutiliza automáticamente para <strong>/ask</strong> y <strong>/upload-txt</strong>.
        </p>
      </div>
    </section>
  );
}