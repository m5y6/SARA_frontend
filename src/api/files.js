import { api } from './client';

export async function uploadFile({ file, fileName }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_name', fileName);

  try {
    const { data } = await api.post('/upload-txt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  } catch (error) {
    // Si el backend responde con un error 400 (Bad Request)
    if (error.response && error.response.status === 400) {
      const errorDetail = error.response.data?.detail || "Hola error";

      // Si el error es el que ya conocemos de los PDFs sin texto
      if (errorDetail.includes("No text could be extracted")) {
        throw new Error(
          "El archivo PDF/Word no contiene texto seleccionable (parece ser una imagen o escaneo). Por favor, sube un documento con texto nativo para poder vectorizar los datos."
        );
      }
    }

    // Si es cualquier otro error, pasamos el mensaje original o uno genérico
    throw new Error(error.response?.data?.detail, "Error al subir el documento al servidor.");
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