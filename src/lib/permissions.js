export function hasPermission(permisos, permission) {
  if (!permisos) {
    return false;
  }

  if (Array.isArray(permisos)) {
    return permisos.includes(permission);
  }

  if (typeof permisos === 'object') {
    return Boolean(permisos[permission]);
  }

  return false;
}

export function isAdminSession(authSession) {
  return authSession?.role === 'admin' || hasPermission(authSession?.permisos, 'admin');
}