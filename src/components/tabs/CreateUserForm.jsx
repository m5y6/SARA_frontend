import { useState } from 'react';

const initialFormData = {
  email: '',
  password: '',
  nombre: '',
  role_id: '',
  role_name: '',
};

export function CreateUserForm({ roles, onCreateUser, isLoading, error, successMessage }) {
  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateUser(formData);
  };

  return (
    <form className="grid gap-3.5 rounded-lg bg-ink-800 p-4 shadow-md shadow-black/20 sm:grid-cols-2 sm:p-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-gray-300">
        Correo electrónico
        <input
          className="w-full rounded-md border border-ink-700 bg-ink-700 px-3.5 py-3 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-50"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-gray-300">
        Contraseña
        <input
          className="w-full rounded-md border border-ink-700 bg-ink-700 px-3.5 py-3 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-50"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-gray-300">
        Nombre
        <input
          className="w-full rounded-md border border-ink-700 bg-ink-700 px-3.5 py-3 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-50"
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleInputChange}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-gray-300">
        Rol
        <select
          className="w-full rounded-md border border-ink-700 bg-ink-700 px-3.5 py-3 text-sm text-gray-100 outline-none transition-colors focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-50"
          name="role_id"
          value={formData.role_id}
          onChange={handleInputChange}
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
      <div className="flex sm:col-span-2">
        <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-brand-blue px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:opacity-50" disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear usuario'}
        </button>
      </div>
      {error && <p className="sm:col-span-2 rounded-md bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
      {successMessage && <p className="sm:col-span-2 m-0 text-sm text-gray-400">{successMessage}</p>}
    </form>
  );
}
