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

// ---------------------------------------------------------------------------
// Presentational helpers (consistentes con AdminTab)
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-brand-yellow/50 focus:ring-2 focus:ring-brand-yellow/30 disabled:opacity-50';

function Card({ title, description, actions, children }) {
  return (
    <div className="rounded-lg bg-ink-700 p-4 sm:p-5">
      {(title || actions) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-gray-200">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
          </div>
          {actions && <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function StatusMessage({ error, status }) {
  if (!error && !status) return null;
  if (error) {
    return <p className="m-0 mt-3 rounded-md bg-red-950/40 px-3.5 py-2.5 text-sm text-red-300">{error}</p>;
  }
  return <p className="m-0 mt-3 rounded-md bg-emerald-950/30 px-3.5 py-2.5 text-sm text-emerald-300">{status}</p>;
}

function EmptyState({ children }) {
  return (
    <div className="rounded-md border border-dashed border-ink-600 px-4 py-8 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-brand-blue px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-ink-600 px-3.5 py-2 text-xs font-semibold text-gray-100 transition-colors hover:bg-ink-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function FieldLabel({ label, hint, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-gray-300">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-gray-500">{hint}</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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

  const previewS3Key = `documents/${buildS3FileName(fileName || 'documento')}`;

  return (
    <section className="rounded-lg bg-ink-800 p-4 shadow-md shadow-black/20 sm:p-5">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand-yellow">Gestión de documentos</p>
          <h2 className="m-0 text-lg font-semibold text-white">Sube y administra documentos en S3</h2>
        </div>

      </header>

      {!canUpload ? (
        <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-5">
          <p className="m-0 text-sm font-semibold text-red-300">Acceso restringido</p>
          <p className="mt-1.5 text-sm text-red-300/80">
            Este módulo requiere rol admin o el permiso{' '}
            <code className="rounded bg-red-950/60 px-1.5 py-0.5 font-mono text-xs">upload</code> para poder verse.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <Card title="Subir documento" description="Los archivos se normalizan y se guardan como .txt en el bucket.">
            <form className="grid gap-3.5 sm:grid-cols-2" onSubmit={handleSubmit}>
              <FieldLabel label="Documento" hint="Formatos aceptados: .txt, .pdf, .docx">
                <input
                  className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-100 hover:file:bg-ink-600`}
                  type="file"
                  accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
                {selectedFile && (
                  <span className="text-xs text-gray-500">
                    Seleccionado: {selectedFile.name} · {formatFileSize(selectedFile.size)}
                  </span>
                )}
              </FieldLabel>

              <FieldLabel label="Nombre base" hint={`Se guardará como: ${previewS3Key}`}>
                <input
                  className={inputClass}
                  type="text"
                  value={fileName}
                  onChange={(event) => setFileName(stripTxtExtension(event.target.value))}
                  placeholder="reglamento-2026"
                />
              </FieldLabel>

              <div className="sm:col-span-2">
                <PrimaryButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Subiendo...' : 'Subir documento'}
                </PrimaryButton>
              </div>
              <div className="sm:col-span-2">
                <StatusMessage error={error} />
              </div>
            </form>

            {result && (
              <div className="mt-4 grid gap-x-4 gap-y-2 border-t border-ink-600 pt-4 text-sm sm:grid-cols-[140px_1fr]">
                <p className="m-0 font-semibold text-emerald-300 sm:col-span-2">Documento subido correctamente</p>
                <span className="text-gray-500">Archivo</span>
                <span className="text-gray-200">{result.file_name}</span>
                <span className="text-gray-500">S3 key</span>
                <span className="break-all font-mono text-xs text-gray-200">{result.s3_key}</span>
                <span className="text-gray-500">Bucket</span>
                <span className="text-gray-200">{result.bucket_name}</span>
                <span className="text-gray-500">Longitud original</span>
                <span className="text-gray-200">{result.original_length}</span>
                <span className="text-gray-500">Longitud normalizada</span>
                <span className="text-gray-200">{result.normalized_length}</span>
              </div>
            )}
          </Card>

          <Card
            title="Documentos cargados"
            description={
              documents.length > 0
                ? `${documents.length} documento${documents.length === 1 ? '' : 's'} en el bucket.`
                : 'Aún no hay documentos cargados.'
            }
            actions={
              <SecondaryButton onClick={loadDocuments} disabled={isLoadingDocuments}>
                {isLoadingDocuments ? 'Cargando...' : 'Recargar lista'}
              </SecondaryButton>
            }
          >
            <StatusMessage error={documentError} />

            {documents.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-ink-600">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-ink-900 text-[11px] uppercase tracking-wide text-gray-400">
                      <th className="px-3.5 py-2.5 font-semibold">Nombre</th>
                      <th className="px-3.5 py-2.5 font-semibold">S3 key</th>
                      <th className="px-3.5 py-2.5 font-semibold">Tamaño</th>
                      <th className="px-3.5 py-2.5 font-semibold">Actualizado</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-600">
                    {documents.map((documentItem) => (
                      <tr key={documentItem.s3_key} className="bg-ink-800 transition-colors hover:bg-ink-700/60">
                        <td className="px-3.5 py-2.5 font-medium text-white">{documentItem.file_name}</td>
                        <td className="max-w-[220px] truncate px-3.5 py-2.5 font-mono text-xs text-gray-400" title={documentItem.s3_key}>
                          {documentItem.s3_key}
                        </td>
                        <td className="px-3.5 py-2.5 text-gray-400">{formatFileSize(documentItem.size) || '—'}</td>
                        <td className="px-3.5 py-2.5 text-gray-400">{formatLastModified(documentItem.last_modified) || '—'}</td>
                        <td className="px-3.5 py-2.5 text-right">
                          <SecondaryButton
                            onClick={() => handleDelete(documentItem)}
                            disabled={deletingKey === documentItem.s3_key}
                            className="hover:bg-red-500/20 hover:text-red-300"
                          >
                            {deletingKey === documentItem.s3_key ? 'Eliminando...' : 'Eliminar'}
                          </SecondaryButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !isLoadingDocuments && <EmptyState>Sube tu primer documento con el formulario de arriba.</EmptyState>
            )}
          </Card>
        </div>
      )}
    </section>
  );
}