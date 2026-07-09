export function ProfileTab({ authSession }) {
  const isAuthenticated = Boolean(authSession);

  const profileRows = isAuthenticated
    ? [
        { label: 'Correo institucional', value: authSession.email },
        { label: 'Rol asignado', value: authSession.role },
      ]
    : [
        { label: 'Correo institucional', value: 'No autenticado' },
        { label: 'Rol asignado', value: 'Sin sesión' },
        { label: 'ID de usuario', value: '-' },
      ];

  const displayName = authSession?.name ?? 'Invitado';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <section className="grid gap-4">
      {/* Bloque de identidad */}
      <div className="flex flex-col gap-4 rounded-lg bg-ink-800 px-5 py-5 shadow-md shadow-black/20 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
        <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-md bg-brand-yellow text-xl font-bold text-ink-950">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-brand-yellow">Mi perfil</p>
          <h2 className="m-0 truncate text-xl font-semibold text-white">{displayName}</h2>

        </div>
      </div>

      {/* Detalle de datos de sesión */}
      <div className="rounded-lg bg-ink-800 p-5 shadow-md shadow-black/20 sm:p-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Datos de sesión y contexto
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {profileRows.map((row) => (
            <div key={row.label} className="grid gap-1.5 rounded-md bg-ink-700 p-4">
              <span className="text-xs text-gray-400">{row.label}</span>
              <strong className="truncate text-sm font-semibold text-gray-100">{row.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}