import api from './api';

export const getFolderTree = async (params) => {
  const res = await api.get('/admin/issuances-mgmt/folders', { params });
  return res.data;
};

export const checkFolderName = async (name, parent_id) => {
  const res = await api.get('/admin/issuances-mgmt/folders/check-name', { params: { name, parent_id } });
  return res.data;
};

export const createFolder = async (data) => {
  const res = await api.post('/admin/issuances-mgmt/folders', data);
  return res.data;
};

export const updateFolder = async (id, data) => {
  const res = await api.put(`/admin/issuances-mgmt/folders/${id}`, data);
  return res.data;
};

export const bulkMoveFolders = async (data) => {
  const res = await api.put('/admin/issuances-mgmt/folders/bulk-move', data);
  return res.data;
};

export const deleteFolder = async (id) => {
  const res = await api.delete(`/admin/issuances-mgmt/folders/${id}`);
  return res.data;
};

export const getCategories = async () => {
  const res = await api.get('/admin/issuances-mgmt/categories');
  return res.data;
};

export const listIssuances = async (params) => {
  const res = await api.get('/admin/issuances-mgmt/issuances', { params });
  return res.data;
};

export const createIssuance = async (formData) => {
  const res = await api.post('/admin/issuances-mgmt/issuances', formData);
  return res.data;
};

export const deleteIssuance = async (id, reason) => {
  const res = await api.delete(`/admin/issuances-mgmt/issuances/${id}`, { data: { reason } });
  return res.data;
};

export const bulkUpdateIssuances = async (data) => {
  const res = await api.post('/admin/issuances-mgmt/issuances/bulk', data);
  return res.data;
};
