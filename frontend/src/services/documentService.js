import api from './api';

/**
 * Document Service - API calls for document management
 * Replaces mock data with real backend integration
 */

// Fallback to mock data if API is not available
const USE_MOCK = false; // Set to true to use mock data instead of API

const MOCK = {
  folders: [
    { id: '2023', label: '2023' },
    { id: '2024', label: '2024' },
    { id: '2025', label: '2025' },
    { id: '2026', label: '2026' }
  ],
  files: {
    '2023': [
      { id: 'f1', name: 'Division_Memo_001.pdf', type: 'pdf', size: '1.2MB', uploadedAt: '2023-09-15' },
      { id: 'f2', name: 'Guidelines_Annex.pdf', type: 'pdf', size: '800KB', uploadedAt: '2023-10-20' }
    ],
    '2024': [
      { id: 'f3', name: 'Regional_Report.pdf', type: 'pdf', size: '2.0MB', uploadedAt: '2024-01-10' },
      { id: 'f4', name: 'Policy_Update.pdf', type: 'pdf', size: '1.1MB', uploadedAt: '2024-03-25' }
    ],
    '2025': [
      { id: 'f5', name: 'SHS_Resource_Package.pdf', type: 'pdf', size: '4.5MB', uploadedAt: '2025-02-14' }
    ],
    '2026': [
      { id: 'f6', name: 'QA_Summary_2026.pdf', type: 'pdf', size: '3.2MB', uploadedAt: '2026-01-05' },
      { id: 'f7', name: 'NAT_Admin_Guide.pdf', type: 'pdf', size: '2.4MB', uploadedAt: '2026-02-01' },
      { id: 'f8', name: 'Regional_Festival_Guide.pdf', type: 'pdf', size: '900KB', uploadedAt: '2026-02-20' }
    ]
  }
};

/**
 * Fetch all folders
 * @returns {Promise<Array>} Array of folder objects
 */
export async function fetchFolders() {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK.folders), 300));
  }
  
  try {
    const response = await api.get('/documents/folders');
    return response.data;
  } catch (error) {
    console.error('Error fetching folders:', error);
    // Fallback to mock data on error
    return new Promise((resolve) => setTimeout(() => resolve(MOCK.folders), 300));
  }
}

/**
 * Fetch files for a specific folder
 * @param {string} folderId - The folder ID to fetch files for
 * @returns {Promise<Array>} Array of file objects
 */
export async function fetchFilesForFolder(folderId) {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK.files[folderId] || []), 300));
  }
  
  try {
    const response = await api.get(`/documents/folder/${folderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching files:', error);
    // Fallback to mock data on error
    return new Promise((resolve) => setTimeout(() => resolve(MOCK.files[folderId] || []), 300));
  }
}

/**
 * Search documents
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query
 * @param {string} params.schoolYear - Filter by school year
 * @param {string} params.gradeLevel - Filter by grade level
 * @param {string} params.strand - Filter by strand
 * @param {string} params.documentType - Filter by document type
 * @returns {Promise<Array>} Array of matching documents
 */
export async function searchDocuments(params = {}) {
  if (USE_MOCK) {
    // Simulate search in mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [];
        const query = (params.q || '').toLowerCase();
        
        Object.values(MOCK.files).forEach(files => {
          files.forEach(file => {
            if (!query || file.name.toLowerCase().includes(query)) {
              results.push(file);
            }
          });
        });
        
        // Apply filters
        if (params.schoolYear && MOCK.files[params.schoolYear]) {
          results = results.filter(f => MOCK.files[params.schoolYear].some(mf => mf.id === f.id));
        }
        
        resolve(results);
      }, 300);
    });
  }
  
  try {
    const response = await api.get('/documents/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
}

/**
 * Upload a document
 * @param {File} file - File to upload
 * @param {Object} metadata - Document metadata
 * @returns {Promise<Object>} Uploaded document info
 */
export async function uploadDocument(file, metadata = {}) {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add metadata fields
  if (metadata.schoolYear) formData.append('schoolYear', metadata.schoolYear);
  if (metadata.gradeLevel) formData.append('gradeLevel', metadata.gradeLevel);
  if (metadata.strand) formData.append('strand', metadata.strand);
  if (metadata.documentType) formData.append('documentType', metadata.documentType);
  if (metadata.subject) formData.append('subject', metadata.subject);
  
  try {
    const response = await api.post('/documents/upload', formData);
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Download a document
 * @param {string} documentId - Document ID
 * @returns {Promise<Blob>} File blob
 */
export async function downloadDocument(documentId) {
  try {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
}

/**
 * Delete a document
 * @param {string} documentId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteDocument(documentId) {
  try {
    await api.delete(`/documents/${documentId}`);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Get dashboard statistics
 * @returns {Promise<Object>} Dashboard stats
 */
export async function getDashboardStats() {
  if (USE_MOCK) {
    return new Promise((resolve) => 
      setTimeout(() => resolve({
        totalDocuments: 8,
        totalUploads: 156,
        pendingReview: 12,
        recentUploads: 5
      }), 300)
    );
  }
  
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalDocuments: 0,
      totalUploads: 0,
      pendingReview: 0,
      recentUploads: 0
    };
  }
}

// Default export for backwards compatibility
export default {
  fetchFolders,
  fetchFilesForFolder,
  searchDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  getDashboardStats
};
