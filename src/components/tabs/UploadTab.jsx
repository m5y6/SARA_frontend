import { useEffect, useMemo, useState } from 'react';
import { deleteDocument, listDocuments, uploadFile } from '../../api/files';
import { hasPermission, isAdminSession } from '../../lib/permissions';

function normalizeDocumentEntries(responseData) {
  const entries = Array.isArray(responseData)
    ? responseData
    : responseData?.documents ?? responseData?.items ?? responseData?.files ?? [];

  return entries
    .map((entry) => {
      if (typeof entry === 'string') {
        return {
          s3_key: entry,
          file_name: entry.split('/').pop() ?? entry,
        };
      }

      const s3Key = entry?.s3_key ?? entry?.key ?? entry?.file_key ?? '';
      const fileName = entry?.file_name ?? entry?.name ?? entry?.filename ?? s3Key.split('/').pop() ?? s3Key;
      const lastModified = entry?.last_modified ?? entry?.lastModified ?? '';

      return {
        ...entry,
        s3_key: s3Key,
        file_name: fileName,
        last_modified: lastModified,
      };
    })
    .filter((entry) => entry.s3_key);
}

function formatFileSize(size) {
  if (typeof size !== 'number' || Number.isNaN(size)) {
    return '';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatLastModified(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function stripTxtExtension(value) {
  return value.replace(/\.txt$/i, '');
}

function buildS3FileName(baseName) {
  const normalizedBaseName = stripTxtExtension(baseName.trim());
  return `${normalizedBaseName}.txt`;
}

export function UploadTab({ authSession }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('documento');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [deletingKey, setDeletingKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canUpload = isAdminSession(authSession) || hasPermission(authSession?.permisos, 'upload');

  const canManageDocuments = useMemo(() => canUpload, [canUpload]);

  const loadDocuments = async () => {
    if (!canManageDocuments) {
      setDocuments([]);
      return;
    }

    setIsLoadingDocuments(true);
    setDocumentError('');

    try {
      const data = await listDocuments();
      setDocuments(normalizeDocumentEntries(data));
    } catch (requestError) {
      setDocumentError(requestError?.response?.data?.detail ?? 'No se pudo cargar la lista de documentos.');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [canManageDocuments]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecciona un archivo (txt, pdf, docx).');
      return;
    }

    const normalizedBaseName = stripTxtExtension(fileName.trim());
    if (!normalizedBaseName) {
      setError('Ingresa un nombre base válido.');
      return;
    }

    const normalizedFileName = buildS3FileName(normalizedBaseName);
    const targetS3Key = `documents/${normalizedFileName}`;
    const hasDuplicateName = documents.some(
      (documentItem) =>
        documentItem.s3_key === targetS3Key ||
        documentItem.file_name === normalizedFileName ||
        documentItem.s3_key.endsWith(`/${normalizedFileName}`),
    );

    if (hasDuplicateName) {
      setError('Ya existe un documento con ese nombre en S3. Elige otro nombre antes de subir.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setResult(null);

    try {
      const data = await uploadFile({ file: selectedFile, fileName: normalizedFileName });
      setResult(data);
      setSelectedFile(null);
      setFileName(stripTxtExtension(data?.file_name ?? 'documento.txt'));
      await loadDocuments();
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo subir el archivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (documentItem) => {
    const confirmed = window.confirm(`Eliminar ${documentItem.file_name ?? documentItem.s3_key}?`);
    if (!confirmed) {
      return;
    }

    setDeletingKey(documentItem.s3_key);
    setDocumentError('');

    try {
      await deleteDocument({ s3Key: documentItem.s3_key });
      await loadDocuments();
    } catch (requestError) {
      setDocumentError(requestError?.response?.data?.detail ?? 'No se pudo eliminar el documento.');
    } finally {
      setDeletingKey('');
    }
  };

  return (
    <section className="panel-card">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Gestión de Documentos</p>
          <h2>Sube y administra documentos en S3</h2>
        </div>
        <div className={`status-pill${canUpload ? ' is-success' : ''}`}>{canUpload ? 'Permiso habilitado' : 'Requiere upload/admin'}</div>
      </header>

      <form className="upload-panel" onSubmit={handleSubmit}>
        {!canUpload ? <p className="form-error">Este endpoint requiere rol admin o permiso upload.</p> : null}

        <label>
          Documento
          <input
            type="file"
            accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label>
          Nombre original
          <input
            type="text"
            value={fileName}
            onChange={(event) => setFileName(stripTxtExtension(event.target.value))}
            placeholder="reglamento-2026"
          />
          <small>Se guardará automáticamente como .txt en S3.</small>
        </label>

        {error ? <p className="form-error span-2">{error}</p> : null}

        <button type="submit" className="primary-button span-2" disabled={isSubmitting || !canUpload}>
          {isSubmitting ? 'Subiendo...' : 'Subir Documento'}
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

      <div className="result-card">
        <h3>Documentos cargados</h3>
        {documentError ? <p className="form-error">{documentError}</p> : null}
        {isLoadingDocuments ? <p className="status-copy">Cargando documentos...</p> : null}
        {!isLoadingDocuments && documents.length === 0 ? <p className="status-copy">No hay documentos cargados.</p> : null}

        <div className="list-stack">
          {documents.map((documentItem) => (
            <div key={documentItem.s3_key} className="list-card">
              <strong>{documentItem.file_name}</strong>
              <span>{documentItem.s3_key}</span>
              {(documentItem.size || documentItem.last_modified) && (
                <small>
                  {documentItem.size ? `Tamaño: ${formatFileSize(documentItem.size)}` : null}
                  {documentItem.size && documentItem.last_modified ? ' · ' : null}
                  {documentItem.last_modified ? `Actualizado: ${formatLastModified(documentItem.last_modified)}` : null}
                </small>
              )}
              <div className="button-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleDelete(documentItem)}
                  disabled={deletingKey === documentItem.s3_key}
                >
                  {deletingKey === documentItem.s3_key ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}