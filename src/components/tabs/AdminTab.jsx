import { useState } from 'react';
import { uploadTxtFile } from '../../api/files';

export function AdminTab({ authSession }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('reglamento_2026');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canUpload = authSession?.role === 'admin';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Selecciona un archivo .txt.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setResult(null);

    try {
      const data = await uploadTxtFile({ file: selectedFile, fileName });
      setResult(data);
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo subir el archivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel-card">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Admin</p>
          <h2>Carga de reglamentos al RAG</h2>
        </div>
        <div className={`status-pill${canUpload ? ' is-success' : ''}`}>{canUpload ? 'Admin habilitado' : 'Solo admin'}</div>
      </header>

      <form className="upload-panel" onSubmit={handleSubmit}>
        {!canUpload ? <p className="form-error">Este endpoint requiere un usuario con rol admin.</p> : null}

        <label>
          Archivo TXT
          <input type="file" accept=".txt" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
        </label>

        <label>
          Nombre en S3
          <input type="text" value={fileName} onChange={(event) => setFileName(event.target.value)} />
        </label>

        {error ? <p className="form-error span-2">{error}</p> : null}

        <button type="submit" className="primary-button span-2" disabled={isSubmitting || !canUpload}>
          {isSubmitting ? 'Subiendo...' : 'Subir TXT a S3'}
        </button>
      </form>

      {result ? (
        <div className="result-card">
          <h3>Resultado</h3>
          <p>Archivo: {result.file_name}</p>
          <p>S3 key: {result.s3_key}</p>
          <p>Bucket: {result.bucket_name}</p>
          <p>Longitud original: {result.original_length}</p>
          <p>Longitud normalizada: {result.normalized_length}</p>
        </div>
      ) : null}
    </section>
  );
}