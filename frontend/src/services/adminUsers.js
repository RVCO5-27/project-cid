import api from './api';

export async function getAllUsers() {
  const res = await api.get('/admin/users');
  return res.data;
}

export async function createUser(payload) {
  const res = await api.post('/admin/users', payload);
  return res.data;
}

export async function updateUser(id, payload) {
  const res = await api.put(`/admin/users/${id}`, payload);
  return res.data;
}

export async function deleteUser(id) {
  await api.delete(`/admin/users/${id}`);
}
