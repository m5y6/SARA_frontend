import { api } from './client';

export async function uploadFile({ file, fileName }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_name', fileName);

  const { data } = await api.post('/upload-txt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
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