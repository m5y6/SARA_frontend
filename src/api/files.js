import { api } from './client';

export async function uploadFile({ file, fileName }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_name', fileName);

  function getFriendlyUploadError(error) {
    const status = error?.response?.status;
    const errorDetail = String(error?.response?.data?.detail ?? '').toLowerCase();

    if (status === 413) {
      return 'Archivo muy pesado. Peso máximo 50 MB.';
    }

    if (status === 400) {
      const isImageOnlyDocument =
        errorDetail.includes('no text could be extracted') ||
        errorDetail.includes('image') ||
        errorDetail.includes('imagen') ||
        errorDetail.includes('scan') ||
        errorDetail.includes('escaneo') ||
        errorDetail.includes('ocr');

      if (isImageOnlyDocument) {
        return 'Error: el PDF o Word contiene solo imágenes. Formato inválido.';
      }
    }

    return error?.response?.data?.detail || 'Error al subir el documento al servidor.';
  }

  try {
    const { data } = await api.post('/upload-txt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  } catch (error) {
    throw new Error(getFriendlyUploadError(error));
  }
}

export async function listDocuments() {
  const { data } = await api.get('/documents');
  return data;
}

export async function deleteDocument({ s3Key }) {
  const { data } = await api.delete('/documents', {
    data: {
      s3_key: s3Key,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return data;
}