// Simulated async API for documents/folders
const MOCK = {
  folders: [
    { id: '2023', label: '2023' },
    { id: '2024', label: '2024' },
    { id: '2025', label: '2025' },
    { id: '2026', label: '2026' }
  ],
  files: {
    '2023': [
      { id: 'f1', name: 'Division_Memo_001.pdf', type: 'pdf', size: '1.2MB' },
      { id: 'f2', name: 'Guidelines_Annex.pdf', type: 'pdf', size: '800KB' }
    ],
    '2024': [
      { id: 'f3', name: 'Regional_Report.pdf', type: 'pdf', size: '2.0MB' },
      { id: 'f4', name: 'Policy_Update.pdf', type: 'pdf', size: '1.1MB' }
    ],
    '2025': [
      { id: 'f5', name: 'SHS_Resource_Package.pdf', type: 'pdf', size: '4.5MB' }
    ],
    '2026': [
      { id: 'f6', name: 'QA_Summary_2026.pdf', type: 'pdf', size: '3.2MB' },
      { id: 'f7', name: 'NAT_Admin_Guide.pdf', type: 'pdf', size: '2.4MB' },
      { id: 'f8', name: 'Regional_Festival_Guide.pdf', type: 'pdf', size: '900KB' }
    ]
  }
};

/**
 * Fetch folders asynchronously (simulated API call)
 * @returns {Promise<Array>} Array of folder objects
 */
export async function fetchFolders() {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK.folders), 300));
}

/**
 * Fetch files for a specific folder asynchronously
 * @param {string} folderId - The folder ID to fetch files for
 * @returns {Promise<Array>} Array of file objects
 */
export async function fetchFilesForFolder(folderId) {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK.files[folderId] || []), 300));
}

// Default export for backwards compatibility
export default { fetchFolders, fetchFilesForFolder };
