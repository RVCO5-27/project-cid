/**
 * Export Utilities
 * Handles export operations (Excel, PDF)
 */

// Determine API base URL - mirrors the logic in api.js
let baseURL = import.meta.env.VITE_API_URL;
if (baseURL) {
  baseURL = String(baseURL).replace(/\/$/, '');
  if (!baseURL.endsWith('/api')) baseURL = `${baseURL}/api`;
} else if (import.meta.env.DEV) {
  baseURL = '/api';
} else {
  const origin = (import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000').replace(/\/$/, '');
  baseURL = `${origin}/api`;
}

/**
 * Prepare query parameters from filter object
 */
export const buildExportParams = (filters) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.type) params.append('type', filters.type);
  if (filters.yearFrom) params.append('yearFrom', filters.yearFrom);
  if (filters.yearTo) params.append('yearTo', filters.yearTo);
  return params.toString();
};

/**
 * Export schools to Excel
 */
export const exportToExcel = async (filters) => {
  try {
    const params = buildExportParams(filters);
    const url = `${baseURL}/schools/export/excel${params ? '?' + params : ''}`;
    
    // Get token from localStorage (same as axios api instance)
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include', // Send cookies for session auth
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `Schools_${new Date().toISOString().split('T')[0]}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
      if (filenameMatch) filename = filenameMatch[1];
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Excel export error:', error);
    throw error;
  }
};

/**
 * Export schools to PDF
 */
export const exportToPDF = async (filters) => {
  try {
    const params = buildExportParams(filters);
    const url = `${baseURL}/schools/export/pdf${params ? '?' + params : ''}`;
    
    // Get token from localStorage (same as axios api instance)
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include', // Send cookies for session auth
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `Schools_${new Date().toISOString().split('T')[0]}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
      if (filenameMatch) filename = filenameMatch[1];
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};
