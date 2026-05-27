import { useState } from 'react';
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

export function AdminTab({ authSession }) {
  const canAdmin = isAdminSession(authSession);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rolePermisosInput, setRolePermisosInput] = useState('{"upload": true}');
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userResult, setUserResult] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleLoadRoles = async () => {
    setError('');
    setStatus('');
    try {
      setRoles(await listRoles());
      setStatus('Roles cargados.');
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudieron cargar los roles.');
    }
  };

  const handleLoadUsers = async () => {
    setError('');
    setStatus('');
    try {
      setUsers(await listUsers());
      setStatus('Usuarios cargados.');
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudieron cargar los usuarios.');
    }
  };

  const handleLoadUser = async () => {
    if (!selectedUserId) {
      setError('Ingresa un ID de usuario.');
      return;
    }

    setError('');
    setStatus('');
    try {
      const data = await getUserById(selectedUserId);
      setUserResult(data);
      setUserForm({
        nombre: data.nombre ?? '',
        email: data.email ?? '',
        role_id: data.rol_id ?? '',
        role_name: data.role_name ?? '',
      });
      setStatus('Usuario cargado.');
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo cargar el usuario.');
    }
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!selectedUserId) {
      setError('Ingresa un ID de usuario.');
      return;
    }

    setIsSaving(true);
    setError('');
    setStatus('');

    const payload = {};
    if (userForm.nombre.trim()) payload.nombre = userForm.nombre.trim();
    if (userForm.email.trim()) payload.email = userForm.email.trim();
    if (userForm.role_id !== '') payload.role_id = Number(userForm.role_id);
    if (userForm.role_name.trim()) payload.role_name = userForm.role_name.trim();

    try {
      const data = await updateUser(selectedUserId, payload);
      setUserResult(data);
      setStatus('Usuario actualizado.');
      setUsers((currentUsers) => currentUsers.map((user) => (String(user.id) === String(selectedUserId) ? data : user)));
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo actualizar el usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRolePermisos = async () => {
    if (!selectedRoleId) {
      setError('Ingresa un ID de rol.');
      return;
    }

    setIsSaving(true);
    setError('');
    setStatus('');

    try {
      const permisos = JSON.parse(rolePermisosInput);
      await updateRolePermisos(selectedRoleId, permisos);
      setStatus('Permisos del rol actualizados.');
    } catch (requestError) {
      if (requestError instanceof SyntaxError) {
        setError('El JSON de permisos no es válido.');
      } else {
        setError(requestError?.response?.data?.detail ?? 'No se pudieron actualizar los permisos del rol.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadAudit = async () => {
    setError('');
    setStatus('');
    try {
      setAuditLog(await listRoleAuditLog());
      setStatus('Auditoría cargada.');
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo cargar la auditoría.');
    }
  };

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

      <div className="dashboard-grid admin-grid">
        <div className="action-card">
          <h3>Roles</h3>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={handleLoadRoles} disabled={!canAdmin || isSaving}>
              Cargar roles
            </button>
            <button type="button" className="ghost-button" onClick={handleLoadAudit} disabled={!canAdmin || isSaving}>
              Ver auditoría
            </button>
          </div>
          <label>
            ID de rol
            <input
              type="number"
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              placeholder="7"
            />
          </label>
          <label>
            Permisos JSON
            <textarea
              rows="4"
              value={rolePermisosInput}
              onChange={(event) => setRolePermisosInput(event.target.value)}
              placeholder='{"upload": true}'
            />
          </label>
          <button type="button" className="primary-button" onClick={handleUpdateRolePermisos} disabled={!canAdmin || isSaving}>
            Actualizar permisos del rol
          </button>
          {roles.length > 0 ? (
            <div className="list-stack">
              {roles.map((role) => (
                <article key={role.id} className="list-card">
                  <strong>{role.nombre}</strong>
                  <span>ID {role.id}</span>
                  <small>{JSON.stringify(role.permisos ?? null)}</small>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        <div className="action-card">
          <h3>Usuarios</h3>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={handleLoadUsers} disabled={!canAdmin || isSaving}>
              Cargar usuarios
            </button>
            <button type="button" className="ghost-button" onClick={handleLoadUser} disabled={!canAdmin || isSaving}>
              Cargar usuario
            </button>
          </div>
          <label>
            ID de usuario
            <input
              type="number"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              placeholder="12"
            />
          </label>
          <form className="form-grid admin-user-form" onSubmit={handleUpdateUser}>
            <label>
              Nombre
              <input
                type="text"
                value={userForm.nombre}
                onChange={(event) => setUserForm((current) => ({ ...current, nombre: event.target.value }))}
              />
            </label>
            <label>
              Correo
              <input
                type="email"
                value={userForm.email}
                onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label>
              Role ID
              <input
                type="number"
                value={userForm.role_id}
                onChange={(event) => setUserForm((current) => ({ ...current, role_id: event.target.value }))}
              />
            </label>
            <label>
              Role name
              <input
                type="text"
                value={userForm.role_name}
                onChange={(event) => setUserForm((current) => ({ ...current, role_name: event.target.value }))}
              />
            </label>
            <button type="submit" className="primary-button span-2" disabled={!canAdmin || isSaving}>
              Actualizar usuario
            </button>
          </form>

          {userResult ? <pre className="json-box">{JSON.stringify(userResult, null, 2)}</pre> : null}

          {users.length > 0 ? (
            <div className="list-stack">
              {users.map((user) => (
                <article key={user.id} className="list-card">
                  <strong>{user.nombre}</strong>
                  <span>{user.email}</span>
                  <small>{user.role_name} · ID {user.id}</small>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        <div className="action-card span-2">
          <h3>Auditoría de roles</h3>
          {auditLog.length > 0 ? (
            <div className="list-stack">
              {auditLog.map((entry) => (
                <article key={entry.id} className="list-card">
                  <strong>{entry.action}</strong>
                  <span>Usuario destino: {entry.target_user ?? '-'}</span>
                  <small>
                    Rol: {entry.role_id ?? '-'} · {entry.created_at}
                  </small>
                  {entry.details ? <pre className="json-box">{JSON.stringify(entry.details, null, 2)}</pre> : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="profile-note-copy">Carga la auditoría para ver los cambios de roles y permisos.</p>
          )}
        </div>
      </div>

      {status ? <p className="status-copy">{status}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}