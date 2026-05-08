import api from './api';

/**
 * Get all audit logs with optional search and filtering
 * @param {object} params - Query parameters (search, actionType, startDate, endDate, page, limit, sortBy, sortOrder)
 * @returns {Promise} - Response with logs array and pagination info
 */
export const getAllAuditLogs = async (params = {}) => {
  try {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

/**
 * Get a specific audit log by ID
 * @param {number} id - Audit log ID
 * @returns {Promise} - Audit log details
 */
export const getAuditLogById = async (id) => {
  try {
    const res = await api.get(`/audit-logs/${id}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching audit log:', error);
    throw error;
  }
};

/**
 * Get audit statistics and summary
 * @param {number} days - Number of days to analyze (default 30)
 * @returns {Promise} - Statistics summary
 */
export const getAuditStatistics = async (days = 30) => {
  try {
    const res = await api.get('/audit-logs/stats/overview', { params: { days } });
    return res.data;
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    throw error;
  }
};

/**
 * Export audit logs as CSV
 * @param {object} params - Filter parameters
 */
export const exportAuditLogs = async (params = {}) => {
  try {
    const res = await api.post(
      '/audit-logs/export/csv',
      { confirm: true },
      {
        params,
        responseType: 'blob',
      }
    );
    // Trigger download
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'activity_log_export.csv');
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw error;
  }
};

