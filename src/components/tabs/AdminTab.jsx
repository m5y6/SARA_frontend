import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  createUser,
  getUserById,
  listRoleAuditLog,
  listRoles,
  listUsers,
  updateRolePermisos,
  updateUser,
} from '../../api/admin';
import { CreateUserForm } from './CreateUserForm';
import { isAdminSession } from '../../lib/permissions';

const emptyUserForm = {
  nombre: '',
  email: '',
  role_id: '',
  role_name: '',
};

const adminSections = [
  {
    id: 'usuarios',
    label: 'Usuarios',
    description: 'Busca cuentas existentes, crea accesos nuevos y edita datos o roles.',
  },
  {
    id: 'auditoria',
    label: 'Auditoría',
    description: 'Historial de cambios aplicados sobre roles y permisos.',
  },
];

const initialRequestState = {
  loading: false,
  error: null,
  status: null,
};

const initialComponentState = {
  users: { ...initialRequestState },
  user: { ...initialRequestState },
  userUpdate: { ...initialRequestState },
  userCreate: { ...initialRequestState },
  roles: { ...initialRequestState },
  roleUpdate: { ...initialRequestState },
  audit: { ...initialRequestState },
};

const inputClass =
  'w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-brand-yellow/50 focus:ring-2 focus:ring-brand-yellow/30 disabled:opacity-50';

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function Card({ title, description, actions, children, cardRef }) {
  return (
    <div ref={cardRef} className="rounded-lg bg-ink-700 p-4 sm:p-5">
      {(title || actions) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-gray-200">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
          </div>
          {actions && <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function StatusMessage({ error, status }) {
  if (!error && !status) return null;
  if (error) {
    return <p className="m-0 mt-3 rounded-md bg-red-950/40 px-3.5 py-2.5 text-sm text-red-300">{error}</p>;
  }
  return <p className="m-0 mt-3 rounded-md bg-emerald-950/30 px-3.5 py-2.5 text-sm text-emerald-300">{status}</p>;
}

function EmptyState({ children }) {
  return (
    <div className="rounded-md border border-dashed border-ink-600 px-4 py-8 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-brand-blue px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-ink-600 px-3.5 py-2 text-xs font-semibold text-gray-100 transition-colors hover:bg-ink-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-ink-600 hover:text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function FieldLabel({ label, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-gray-300">
      {label}
      {children}
    </label>
  );
}

function Chevron({ open }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function JsonBlock({ value }) {
  return (
    <pre className="m-0 overflow-auto rounded-md bg-ink-900 p-3.5 font-mono text-xs leading-5 text-gray-300">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AdminTab({ authSession }) {
  const canAdmin = isAdminSession(authSession);
  const [activeSection, setActiveSection] = useState('usuarios');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rolePermisosInput, setRolePermisosInput] = useState('{"upload": true}');

  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userResult, setUserResult] = useState(null);

  const [expandedRoleIds, setExpandedRoleIds] = useState(() => new Set());
  const [expandedAuditIds, setExpandedAuditIds] = useState(() => new Set());

  const [requests, setRequests] = useState(initialComponentState);

  const editUserCardRef = useRef(null);
  const editRoleCardRef = useRef(null);

  const setRequestState = (req, loading, error, status) => {
    setRequests((prev) => ({ ...prev, [req]: { loading, error, status } }));
  };

  const handleApiCall = useCallback(async (reqName, apiFn, ...args) => {
    setRequestState(reqName, true, null, null);
    try {
      const result = await apiFn(...args);
      setRequestState(reqName, false, null, 'Operación exitosa.');
      return result;
    } catch (error) {
      const errorMessage = error?.response?.data?.detail ?? 'Ocurrió un error en la solicitud.';
      setRequestState(reqName, false, errorMessage, null);
      throw error;
    }
  }, []);

  const handleLoadRoles = useCallback(async () => {
    try {
      const loadedRoles = await handleApiCall('roles', listRoles);
      setRoles(loadedRoles);
    } catch (error) {
      // Error is handled by handleApiCall
    }
  }, [handleApiCall]);

  useEffect(() => {
    if (activeSection === 'roles' || (activeSection === 'usuarios' && canAdmin)) {
      if (roles.length === 0) {
        handleLoadRoles();
      }
    }
  }, [activeSection, canAdmin, roles.length, handleLoadRoles]);

  const handleLoadUsers = useCallback(async () => {
    try {
      const loadedUsers = await handleApiCall('users', listUsers);
      setUsers(loadedUsers);
    } catch (error) {
      // Error is handled by handleApiCall
    }
  }, [handleApiCall]);

  const handleLoadUser = useCallback(
    async (idOverride) => {
      const targetId = idOverride ?? selectedUserId;
      if (!targetId) {
        setRequestState('user', false, 'Ingresa un ID de usuario.', null);
        return;
      }
      try {
        const data = await handleApiCall('user', getUserById, targetId);
        setSelectedUserId(String(targetId));
        setUserResult(data);
        setUserForm({
          nombre: data.nombre ?? '',
          email: data.email ?? '',
          role_id: data.rol_id ?? '',
          role_name: data.role_name ?? '',
        });
        requestAnimationFrame(() => {
          editUserCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } catch (error) {
        // Error is handled by handleApiCall
      }
    },
    [handleApiCall, selectedUserId],
  );

  const handleUpdateUser = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedUserId) {
        setRequestState('userUpdate', false, 'Ingresa un ID de usuario.', null);
        return;
      }

      const payload = {};
      if (userForm.nombre.trim()) payload.nombre = userForm.nombre.trim();
      if (userForm.email.trim()) payload.email = userForm.email.trim();
      if (userForm.role_id !== '') payload.role_id = Number(userForm.role_id);
      if (userForm.role_name.trim()) payload.role_name = userForm.role_name.trim();

      try {
        const data = await handleApiCall('userUpdate', updateUser, selectedUserId, payload);
        setUserResult(data);
        setUsers((current) => current.map((u) => (String(u.id) === String(selectedUserId) ? data : u)));
      } catch (error) {
        // Error is handled by handleApiCall
      }
    },
    [handleApiCall, selectedUserId, userForm],
  );

  const handleCreateUser = useCallback(
    async (formData) => {
      const payload = {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre || '',
        rol_id: formData.role_id ? Number(formData.role_id) : null,
      };

      try {
        const newUser = await handleApiCall('userCreate', createUser, payload);
        setUsers((current) => [...current, newUser]);
        setShowCreateForm(false);
      } catch (error) {
        // Error is handled by handleApiCall
      }
    },
    [handleApiCall],
  );

  const handleEditRoleShortcut = useCallback((role) => {
    setSelectedRoleId(String(role.id));
    setRolePermisosInput(JSON.stringify(role.permisos ?? {}, null, 2));
    requestAnimationFrame(() => {
      editRoleCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleUpdateRolePermisos = useCallback(async () => {
    if (!selectedRoleId) {
      setRequestState('roleUpdate', false, 'Ingresa un ID de rol.', null);
      return;
    }

    try {
      const permisos = JSON.parse(rolePermisosInput);
      await handleApiCall('roleUpdate', updateRolePermisos, selectedRoleId, permisos);
      handleLoadRoles();
    } catch (error) {
      if (error instanceof SyntaxError) {
        setRequestState('roleUpdate', false, 'El JSON de permisos no es válido.', null);
      }
      // Other errors handled by handleApiCall
    }
  }, [handleApiCall, selectedRoleId, rolePermisosInput, handleLoadRoles]);

  const handleLoadAudit = useCallback(async () => {
    try {
      const loadedAudit = await handleApiCall('audit', listRoleAuditLog);
      setAuditLog(loadedAudit);
    } catch (error) {
      // Error is handled by handleApiCall
    }
  }, [handleApiCall]);

  const toggleRoleExpanded = (id) => {
    setExpandedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAuditExpanded = (id) => {
    setExpandedAuditIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isLoading = Object.values(requests).some((r) => r.loading);
  const currentSection = adminSections.find((section) => section.id === activeSection);

  return (
    <section className="rounded-lg bg-ink-800 p-4 shadow-md shadow-black/20 sm:p-5">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-brand-yellow">Administración</p>
          <h2 className="m-0 text-lg font-semibold text-white">Usuarios, roles y auditoría</h2>
        </div>

      </header>

      {!canAdmin && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-5">
          <p className="m-0 text-sm font-semibold text-red-300">Acceso restringido</p>
          <p className="mt-1.5 text-sm text-red-300/80">
            Este módulo requiere rol admin o el permiso{' '}
            <code className="rounded bg-red-950/60 px-1.5 py-0.5 font-mono text-xs">admin</code> para poder verse.
          </p>
        </div>
      )}

      {canAdmin && (
        <>
          <nav className="mb-1 flex gap-6 border-b border-ink-600" aria-label="Secciones de administración">
            {adminSections.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`relative -mb-px border-b-2 px-0.5 pb-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    active ? 'border-brand-yellow text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                  disabled={isLoading}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>
          <p className="mb-5 mt-3 text-sm text-gray-400">{currentSection?.description}</p>

          {activeSection === 'usuarios' && (
            <div className="grid gap-4">
              <Card
                title="Usuarios registrados"
                description={
                  users.length > 0
                    ? `${users.length} cuenta${users.length === 1 ? '' : 's'} cargada${users.length === 1 ? '' : 's'}.`
                    : 'Aún no has cargado la lista de usuarios.'
                }
                actions={
                  <PrimaryButton onClick={handleLoadUsers} disabled={requests.users.loading}>
                    {requests.users.loading ? 'Cargando...' : 'Cargar usuarios'}
                  </PrimaryButton>
                }
              >
                <StatusMessage error={requests.users.error} />
                {users.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-ink-600">
                    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-ink-900 text-[11px] uppercase tracking-wide text-gray-400">
                          <th className="px-3.5 py-2.5 font-semibold">Nombre</th>
                          <th className="px-3.5 py-2.5 font-semibold">Correo</th>
                          <th className="px-3.5 py-2.5 font-semibold">Rol</th>
                          <th className="px-3.5 py-2.5 font-semibold">ID</th>
                          <th className="px-3.5 py-2.5 text-right font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-600">
                        {users.map((user) => (
                          <tr key={user.id} className="bg-ink-800 transition-colors hover:bg-ink-700/60">
                            <td className="px-3.5 py-2.5 font-medium text-white">{user.nombre}</td>
                            <td className="px-3.5 py-2.5 text-gray-300">{user.email}</td>
                            <td className="px-3.5 py-2.5">
                              <span className="inline-flex rounded-full bg-ink-700 px-2.5 py-1 text-xs font-medium text-gray-200">
                                {user.role_name}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-gray-500">{user.id}</td>
                            <td className="px-3.5 py-2.5 text-right">
                              <SecondaryButton onClick={() => handleLoadUser(user.id)} disabled={requests.user.loading}>
                                Editar
                              </SecondaryButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !requests.users.loading && <EmptyState>Pulsa "Cargar usuarios" para ver la lista de cuentas.</EmptyState>
                )}
              </Card>

              <Card
                title="Crear usuario"
                description="Da acceso a un nuevo colaborador asignándole un rol."
                actions={
                  <SecondaryButton onClick={() => setShowCreateForm((v) => !v)} disabled={requests.userCreate.loading}>
                    {showCreateForm ? 'Cancelar' : 'Nuevo usuario'}
                  </SecondaryButton>
                }
              >
                {showCreateForm ? (
                  <CreateUserForm
                    roles={roles}
                    onCreateUser={handleCreateUser}
                    isLoading={requests.userCreate.loading}
                    error={requests.userCreate.error}
                    successMessage={requests.userCreate.status}
                  />
                ) : (
                  <EmptyState>Pulsa "Nuevo usuario" para completar sus datos y asignarle un rol.</EmptyState>
                )}
              </Card>

              <Card
                cardRef={editUserCardRef}
                title="Editar usuario"
                description="Busca una cuenta por su ID para actualizar sus datos o su rol."
              >
                <div className="flex flex-wrap items-end gap-2.5">
                  <div className="min-w-[160px] flex-1">
                    <FieldLabel label="ID de usuario">
                      <input
                        className={inputClass}
                        type="number"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        placeholder="12"
                        disabled={requests.user.loading}
                      />
                    </FieldLabel>
                  </div>
                  <PrimaryButton onClick={() => handleLoadUser()} disabled={requests.user.loading}>
                    {requests.user.loading ? 'Buscando...' : 'Buscar'}
                  </PrimaryButton>
                </div>
                <StatusMessage error={requests.user.error} />

                {userResult && (
                  <form className="mt-5 grid gap-3.5 border-t border-ink-600 pt-5 sm:grid-cols-2" onSubmit={handleUpdateUser}>
                    <p className="m-0 text-sm text-gray-400 sm:col-span-2">
                      Editando a <span className="font-semibold text-white">{userResult.nombre}</span> · {userResult.email}
                    </p>
                    <FieldLabel label="Nombre">
                      <input
                        className={inputClass}
                        type="text"
                        value={userForm.nombre}
                        onChange={(e) => setUserForm((c) => ({ ...c, nombre: e.target.value }))}
                      />
                    </FieldLabel>
                    <FieldLabel label="Correo">
                      <input
                        className={inputClass}
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm((c) => ({ ...c, email: e.target.value }))}
                      />
                    </FieldLabel>
                    <FieldLabel label="Rol">
                      <select
                        className={inputClass}
                        value={userForm.role_id}
                        onChange={(e) => {
                          const role = roles.find((r) => String(r.id) === e.target.value);
                          setUserForm((c) => ({ ...c, role_id: e.target.value, role_name: role?.nombre ?? c.role_name }));
                        }}
                        disabled={roles.length === 0}
                      >
                        <option value="">Selecciona un rol</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.nombre} · ID {role.id}
                          </option>
                        ))}
                      </select>
                    </FieldLabel>
                    <FieldLabel label="Role name">
                      <input
                        className={inputClass}
                        type="text"
                        value={userForm.role_name}
                        onChange={(e) => setUserForm((c) => ({ ...c, role_name: e.target.value }))}
                      />
                    </FieldLabel>
                    <div className="sm:col-span-2">
                      <PrimaryButton type="submit" disabled={requests.userUpdate.loading}>
                        {requests.userUpdate.loading ? 'Actualizando...' : 'Actualizar usuario'}
                      </PrimaryButton>
                    </div>
                    <div className="sm:col-span-2">
                      <StatusMessage error={requests.userUpdate.error} status={requests.userUpdate.status} />
                    </div>
                  </form>
                )}
              </Card>
            </div>
          )}

          {activeSection === 'roles' && (
            <div className="grid gap-4">
              <Card
                title="Roles configurados"
                description={
                  roles.length > 0
                    ? `${roles.length} rol${roles.length === 1 ? '' : 'es'} definido${roles.length === 1 ? '' : 's'}.`
                    : 'Aún no has cargado los roles.'
                }
                actions={
                  <PrimaryButton onClick={handleLoadRoles} disabled={requests.roles.loading}>
                    {requests.roles.loading ? 'Cargando...' : 'Recargar roles'}
                  </PrimaryButton>
                }
              >
                <StatusMessage error={requests.roles.error} />
                {roles.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-ink-600">
                    <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-ink-900 text-[11px] uppercase tracking-wide text-gray-400">
                          <th className="px-3.5 py-2.5 font-semibold">Nombre</th>
                          <th className="px-3.5 py-2.5 font-semibold">ID</th>
                          <th className="px-3.5 py-2.5 font-semibold">Permisos</th>
                          <th className="px-3.5 py-2.5 text-right font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-600">
                        {roles.map((role) => {
                          const isExpanded = expandedRoleIds.has(role.id);
                          const permCount = Object.keys(role.permisos ?? {}).length;
                          return (
                            <Fragment key={role.id}>
                              <tr className="bg-ink-800 transition-colors hover:bg-ink-700/60">
                                <td className="px-3.5 py-2.5 font-medium text-white">{role.nombre}</td>
                                <td className="px-3.5 py-2.5 text-gray-500">{role.id}</td>
                                <td className="px-3.5 py-2.5 text-gray-300">
                                  {permCount} permiso{permCount === 1 ? '' : 's'}
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <div className="flex justify-end gap-1.5">
                                    <GhostButton onClick={() => toggleRoleExpanded(role.id)}>
                                      JSON <Chevron open={isExpanded} />
                                    </GhostButton>
                                    <SecondaryButton onClick={() => handleEditRoleShortcut(role)}>Editar</SecondaryButton>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-ink-800">
                                  <td colSpan={4} className="px-3.5 pb-3.5">
                                    <JsonBlock value={role.permisos} />
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !requests.roles.loading && <EmptyState>Pulsa "Recargar roles" para ver los roles configurados.</EmptyState>
                )}
              </Card>

              <Card
                cardRef={editRoleCardRef}
                title="Editar permisos de un rol"
                description="Escribe el ID del rol y su nuevo objeto de permisos en formato JSON."
              >
                <div className="grid gap-3.5 sm:grid-cols-[160px_1fr]">
                  <FieldLabel label="ID de rol">
                    <input
                      className={inputClass}
                      type="number"
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      placeholder="7"
                    />
                  </FieldLabel>
                  <FieldLabel label="Permisos (JSON)">
                    <textarea
                      className={`${inputClass} resize-y font-mono`}
                      rows="6"
                      value={rolePermisosInput}
                      onChange={(e) => setRolePermisosInput(e.target.value)}
                      placeholder='{"upload": true}'
                    />
                  </FieldLabel>
                </div>
                <div className="mt-3.5">
                  <PrimaryButton onClick={handleUpdateRolePermisos} disabled={requests.roleUpdate.loading}>
                    {requests.roleUpdate.loading ? 'Actualizando...' : 'Actualizar permisos del rol'}
                  </PrimaryButton>
                </div>
                <StatusMessage error={requests.roleUpdate.error} status={requests.roleUpdate.status} />
              </Card>
            </div>
          )}

          {activeSection === 'auditoria' && (
            <div className="grid gap-4">
              <Card
                title="Historial de auditoría"
                description={
                  auditLog.length > 0
                    ? `${auditLog.length} registro${auditLog.length === 1 ? '' : 's'} cargado${auditLog.length === 1 ? '' : 's'}.`
                    : 'Aún no has cargado el historial.'
                }
                actions={
                  <PrimaryButton onClick={handleLoadAudit} disabled={requests.audit.loading}>
                    {requests.audit.loading ? 'Cargando...' : 'Cargar auditoría'}
                  </PrimaryButton>
                }
              >
                <StatusMessage error={requests.audit.error} />
                {auditLog.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-ink-600">
                    <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-ink-900 text-[11px] uppercase tracking-wide text-gray-400">
                          <th className="px-3.5 py-2.5 font-semibold">Acción</th>
                          <th className="px-3.5 py-2.5 font-semibold">Usuario destino</th>
                          <th className="px-3.5 py-2.5 font-semibold">Rol</th>
                          <th className="px-3.5 py-2.5 font-semibold">Fecha</th>
                          <th className="px-3.5 py-2.5 text-right font-semibold">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-600">
                        {auditLog.map((entry) => {
                          const isExpanded = expandedAuditIds.has(entry.id);
                          return (
                            <Fragment key={entry.id}>
                              <tr className="bg-ink-800 transition-colors hover:bg-ink-700/60">
                                <td className="px-3.5 py-2.5 font-medium text-white">{entry.action}</td>
                                <td className="px-3.5 py-2.5 text-gray-300">{entry.target_user ?? '—'}</td>
                                <td className="px-3.5 py-2.5 text-gray-500">{entry.role_id ?? '—'}</td>
                                <td className="px-3.5 py-2.5 text-gray-500">{new Date(entry.created_at).toLocaleString()}</td>
                                <td className="px-3.5 py-2.5 text-right">
                                  {entry.details ? (
                                    <GhostButton onClick={() => toggleAuditExpanded(entry.id)}>
                                      Ver <Chevron open={isExpanded} />
                                    </GhostButton>
                                  ) : (
                                    <span className="text-xs text-gray-600">—</span>
                                  )}
                                </td>
                              </tr>
                              {isExpanded && entry.details && (
                                <tr className="bg-ink-800">
                                  <td colSpan={5} className="px-3.5 pb-3.5">
                                    <JsonBlock value={entry.details} />
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !requests.audit.loading && <EmptyState>Pulsa "Cargar auditoría" para ver el historial de cambios.</EmptyState>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </section>
  );
}