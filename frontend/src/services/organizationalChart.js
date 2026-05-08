import api from './api';

export const getOrganizationalChart = async () => {
  const response = await api.get('/organizational-chart');
  return response.data;
};

export const updateOrganizationalChart = async (chart) => {
  const response = await api.put('/organizational-chart', chart);
  return response.data;
};
