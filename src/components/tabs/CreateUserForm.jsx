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
    <form className="form-grid" onSubmit={handleSubmit}>
      <label>
        Correo electrónico
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </label>
      <label>
        Contraseña
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </label>
      <label>
        Nombre
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleInputChange}
        />
      </label>
      <label>
        Rol
        <select
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
      <div className="button-row span-2">
        <button type="submit" className="primary-button" disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear usuario'}
        </button>
      </div>
      {error && <p className="form-error span-2">{error}</p>}
      {successMessage && <p className="status-copy span-2">{successMessage}</p>}
    </form>
  );
}
