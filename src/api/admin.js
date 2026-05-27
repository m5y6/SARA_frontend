import { api } from './client';

export async function listRoles() {
  const { data } = await api.get('/admin/roles');
  return data;
}

export async function listUsers() {
  const { data } = await api.get('/admin/users');
  return data;
}

export async function getUserById(userId) {
  const { data } = await api.get(`/admin/users/${userId}`);
  return data;
}

export async function updateUser(userId, payload) {
  const { data } = await api.patch(`/admin/users/${userId}`, payload);
  return data;
}

export async function updateRolePermisos(roleId, permisos) {
  const { data } = await api.patch(`/admin/roles/${roleId}/permisos`, { permisos });
  return data;
}

export async function listRoleAuditLog() {
  const { data } = await api.get('/admin/roles/audit');
  return data;
}