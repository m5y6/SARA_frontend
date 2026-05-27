import { api } from './client';

export async function uploadTxtFile({ file, fileName }) {
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