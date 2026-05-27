import { useState } from 'react';

export function LoginTab({ onLogin, authSession, onLogout }) {
  const [email, setEmail] = useState('admin@correo.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await onLogin({ email, password });
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel-card panel-login">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Acceso institucional</p>
          <h2>Login contra la API</h2>
        </div>
        {authSession ? (
          <button type="button" className="ghost-button" onClick={onLogout}>
            Cerrar sesión
          </button>
        ) : null}
      </header>

      <form className="form-grid login-form" onSubmit={handleSubmit}>
        <label>
          Correo
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        {error ? <p className="form-error span-2">{error}</p> : null}

        <button type="submit" className="primary-button span-2" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      {authSession ? (
        <div className="session-summary">
          <h3>Sesión guardada</h3>
          <p>{authSession.name} · {authSession.email}</p>
          <p>{authSession.role} · user_id {authSession.userId}</p>
        </div>
      ) : null}
    </section>
  );
}