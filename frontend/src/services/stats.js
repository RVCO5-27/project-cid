import api from './api';

/**
 * Get global statistics summary for homepage and dashboard
 */
export const getStatsSummary = async () => {
  const res = await api.get('/stats/summary');
  return res.data;
};
