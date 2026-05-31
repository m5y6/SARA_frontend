import { useState } from 'react';
import { uploadFile } from '../../api/files';
import { hasPermission, isAdminSession } from '../../lib/permissions';

export function UploadTab({ authSession }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('reglamento-2026.txt');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canUpload = isAdminSession(authSession) || hasPermission(authSession?.permisos, 'upload');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecciona un archivo (txt, pdf, docx).');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setResult(null);

    try {
      const data = await uploadFile({ file: selectedFile, fileName });
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
          <p className="panel-kicker">Carga de Archivos</p>
          <h2>Normaliza y sube documentos al S3</h2>
        </div>
        <div className={`status-pill${canUpload ? ' is-success' : ''}`}>{canUpload ? 'Permiso habilitado' : 'Requiere upload/admin'}</div>
      </header>

      <form className="upload-panel" onSubmit={handleSubmit}>
        {!canUpload ? <p className="form-error">Este endpoint requiere rol admin o permiso upload.</p> : null}

        <label>
          Archivo
          <input
            type="file"
            accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label>
          Nombre en S3
          <input
            type="text"
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            placeholder="reglamento-2026.txt"
          />
        </label>

        {error ? <p className="form-error span-2">{error}</p> : null}

        <button type="submit" className="primary-button span-2" disabled={isSubmitting || !canUpload}>
          {isSubmitting ? 'Subiendo...' : 'Subir archivo a S3'}
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