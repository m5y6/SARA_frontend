import { useState } from 'react';
import { healthCheck, normalizeText } from '../../api/system';

export function DashboardTab() {
  const [health, setHealth] = useState(null);
  const [text, setText] = useState('Texto   con  espacios\n\nraros');
  const [normalizedText, setNormalizedText] = useState('');
  const [error, setError] = useState('');

  const handleHealthCheck = async () => {
    setError('');
    try {
      setHealth(await healthCheck());
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo consultar health.');
    }
  };

  const handleNormalize = async () => {
    setError('');
    try {
      const data = await normalizeText(text);
      setNormalizedText(data.normalized_text ?? data.text ?? JSON.stringify(data));
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo normalizar el texto.');
    }
  };

  return (
    <section className="panel-card">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Sistema</p>
          <h2>Estado del sistema y normalización</h2>
        </div>
      </header>

      <div className="metrics-grid">
        <article className="metric-card">
          <span className="metric-value">/health</span>
          <span className="metric-label">Chequeo del backend</span>
        </article>
        <article className="metric-card">
          <span className="metric-value">/normalize-text</span>
          <span className="metric-label">Limpieza de texto</span>
        </article>
        <article className="metric-card">
          <span className="metric-value">API</span>
          <span className="metric-label">Base local</span>
        </article>
      </div>

      <div className="dashboard-grid">
        <div className="action-card">
          <h3>Health</h3>
          <button type="button" className="primary-button" onClick={handleHealthCheck}>
            Consultar health
          </button>
          {health ? <pre className="json-box">{JSON.stringify(health, null, 2)}</pre> : null}
        </div>

        <div className="action-card">
          <h3>Normalizar texto</h3>
          <textarea rows="5" value={text} onChange={(event) => setText(event.target.value)} />
          <button type="button" className="primary-button" onClick={handleNormalize}>
            Normalizar
          </button>
          {normalizedText ? <p className="normalized-text">{normalizedText}</p> : null}
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}