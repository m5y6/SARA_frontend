import { useEffect, useState, useCallback } from 'react';
import {
  getUserById,
  listRoleAuditLog,
  listRoles,
  listUsers,
  updateRolePermisos,
  updateUser,
} from '../../api/admin';
import { isAdminSession } from '../../lib/permissions';

const emptyUserForm = {
  nombre: '',
  email: '',
  role_id: '',
  role_name: '',
};

const adminSections = [
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'roles', label: 'Roles' },
  { id: 'auditoria', label: 'Auditoría' },
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
  roles: { ...initialRequestState },
  roleUpdate: { ...initialRequestState },
  audit: { ...initialRequestState },
};

export function AdminTab({ authSession }) {
  const canAdmin = isAdminSession(authSession);
  const [activeSection, setActiveSection] = useState('usuarios');

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rolePermisosInput, setRolePermisosInput] = useState('{"upload": true}');

  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userResult, setUserResult] = useState(null);

  const [requests, setRequests] = useState(initialComponentState);

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

  const handleLoadUser = useCallback(async () => {
    if (!selectedUserId) {
      setRequestState('user', false, 'Ingresa un ID de usuario.', null);
      return;
    }
    try {
      const data = await handleApiCall('user', getUserById, selectedUserId);
      setUserResult(data);
      setUserForm({
        nombre: data.nombre ?? '',
        email: data.email ?? '',
        role_id: data.rol_id ?? '',
        role_name: data.role_name ?? '',
      });
    } catch (error) {
      // Error is handled by handleApiCall
    }
  }, [handleApiCall, selectedUserId]);

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

  const handleUpdateRolePermisos = useCallback(async () => {
    if (!selectedRoleId) {
      setRequestState('roleUpdate', false, 'Ingresa un ID de rol.', null);
      return;
    }

    try {
      const permisos = JSON.parse(rolePermisosInput);
      await handleApiCall('roleUpdate', updateRolePermisos, selectedRoleId, permisos);
      handleLoadRoles(); // Refresh roles list
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

  const isLoading = Object.values(requests).some((r) => r.loading);

  return (
    <section className="panel-card">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Administración</p>
          <h2>Usuarios, roles y auditoría</h2>
        </div>
        <div className={`status-pill${canAdmin ? ' is-success' : ''}`}>{canAdmin ? 'Solo admin' : 'Sin acceso'}</div>
      </header>

      {!canAdmin ? <p className="form-error">Este módulo requiere rol admin o permiso admin.</p> : null}

      {canAdmin && (
        <>
          <nav className="section-nav" aria-label="Secciones de administración">
            {adminSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`section-nav-link${activeSection === section.id ? ' is-active' : ''}`}
                onClick={() => setActiveSection(section.id)}
                disabled={isLoading}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {activeSection === 'usuarios' && (
            <div className="action-card admin-section-card">
              <h3>Usuarios</h3>
              <p className="profile-note-copy">Consulta, edita y actualiza usuarios desde esta sección.</p>
              <div className="button-row">
                <button type="button" className="primary-button" onClick={handleLoadUsers} disabled={requests.users.loading}>
                  {requests.users.loading ? 'Cargando...' : 'Cargar usuarios'}
                </button>
              </div>
              {requests.users.error && <p className="form-error">{requests.users.error}</p>}
              {users.length > 0 && (
                <div className="list-stack">
                  {users.map((user) => (
                    <article key={user.id} className="list-card">
                      <strong>{user.nombre}</strong>
                      <span>{user.email}</span>
                      <small>{user.role_name} · ID {user.id}</small>
                    </article>
                  ))}
                </div>
              )}

              <hr />

              <h4>Editar Usuario</h4>
              <label>
                ID de usuario a editar
                <input
                  type="number"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder="12"
                  disabled={requests.user.loading}
                />
              </label>
              <div className="button-row">
                <button type="button" className="ghost-button" onClick={handleLoadUser} disabled={requests.user.loading}>
                  {requests.user.loading ? 'Cargando...' : 'Cargar usuario por ID'}
                </button>
              </div>
              {requests.user.error && <p className="form-error">{requests.user.error}</p>}

              {userResult && (
                <form className="form-grid admin-user-form" onSubmit={handleUpdateUser}>
                  <label>
                    Nombre
                    <input type="text" value={userForm.nombre} onChange={(e) => setUserForm((c) => ({ ...c, nombre: e.target.value }))} />
                  </label>
                  <label>
                    Correo
                    <input type="email" value={userForm.email} onChange={(e) => setUserForm((c) => ({ ...c, email: e.target.value }))} />
                  </label>
                  <label>
                    Rol
                    <select
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
                  </label>
                  <label>
                    Role name
                    <input type="text" value={userForm.role_name} onChange={(e) => setUserForm((c) => ({ ...c, role_name: e.target.value }))} />
                  </label>
                  <button type="submit" className="primary-button span-2" disabled={requests.userUpdate.loading}>
                    {requests.userUpdate.loading ? 'Actualizando...' : 'Actualizar usuario'}
                  </button>
                  {requests.userUpdate.error && <p className="form-error span-2">{requests.userUpdate.error}</p>}
                  {requests.userUpdate.status && <p className="status-copy span-2">{requests.userUpdate.status}</p>}
                </form>
              )}
            </div>
          )}

          {activeSection === 'roles' && (
            <div className="action-card admin-section-card">
              <h3>Roles y Permisos</h3>
              <p className="profile-note-copy">Actualiza permisos y revisa la configuración por rol.</p>
              <div className="button-row">
                <button type="button" className="primary-button" onClick={handleLoadRoles} disabled={requests.roles.loading}>
                  {requests.roles.loading ? 'Cargando...' : 'Recargar roles'}
                </button>
              </div>
              {requests.roles.error && <p className="form-error">{requests.roles.error}</p>}
              {roles.length > 0 && (
                <div className="list-stack">
                  {roles.map((role) => (
                    <article key={role.id} className="list-card">
                      <strong>{role.nombre}</strong>
                      <span>ID {role.id}</span>
                      <pre className="json-box">{JSON.stringify(role.permisos ?? {}, null, 2)}</pre>
                    </article>
                  ))}
                </div>
              )}
              <hr />
              <h4>Editar Permisos de Rol</h4>
              <label>
                ID de rol a editar
                <input type="number" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} placeholder="7" />
              </label>
              <label>
                Permisos (en formato JSON)
                <textarea rows="4" value={rolePermisosInput} onChange={(e) => setRolePermisosInput(e.target.value)} placeholder='{"upload": true}' />
              </label>
              <button type="button" className="primary-button" onClick={handleUpdateRolePermisos} disabled={requests.roleUpdate.loading}>
                {requests.roleUpdate.loading ? 'Actualizando...' : 'Actualizar permisos del rol'}
              </button>
              {requests.roleUpdate.error && <p className="form-error">{requests.roleUpdate.error}</p>}
              {requests.roleUpdate.status && <p className="status-copy">{requests.roleUpdate.status}</p>}
            </div>
          )}

          {activeSection === 'auditoria' && (
            <div className="action-card admin-section-card">
              <h3>Auditoría de Roles</h3>
              <p className="profile-note-copy">Revisa aquí los cambios aplicados sobre roles y permisos.</p>
              <div className="button-row">
                <button type="button" className="primary-button" onClick={handleLoadAudit} disabled={requests.audit.loading}>
                  {requests.audit.loading ? 'Cargando...' : 'Cargar auditoría'}
                </button>
              </div>
              {requests.audit.error && <p className="form-error">{requests.audit.error}</p>}
              {auditLog.length > 0 ? (
                <div className="list-stack">
                  {auditLog.map((entry) => (
                    <article key={entry.id} className="list-card">
                      <strong>{entry.action}</strong>
                      <span>Usuario destino: {entry.target_user ?? '-'}</span>
                      <small>
                        Rol: {entry.role_id ?? '-'} · {new Date(entry.created_at).toLocaleString()}
                      </small>
                      {entry.details && <pre className="json-box">{JSON.stringify(entry.details, null, 2)}</pre>}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="profile-note-copy">No hay registros de auditoría o no se han cargado.</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}