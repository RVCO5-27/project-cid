import api from './api';

/**
 * Issuances document helpers.
 * Now connected to the real backend API.
 */

function mapIssuanceItem(item) {
  return {
    id: item.id,
    name: item.title,
    doc_number: item.doc_number,
    category: item.category_name,
    category_prefix: item.category_prefix,
    date: item.date_issued || item.created_at,
    file_path: item.file_path || '',
    tags: item.tags,
    size: item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : 'PDF',
    type: 'pdf',
  };
}

function dedupeById(items = []) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    const key = item?.id ?? `${item?.doc_number || ''}-${item?.title || ''}-${item?.created_at || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

export async function fetchFolders() {
  // Returns both unique series years and custom folders for browsing
  try {
    console.log('[issuancesDocumentService] Fetching folders...');
    const [{ data: years }, { data: folders }] = await Promise.all([
      api.get('/issuances/years'),
      api.get('/issuances/folders')
    ]);
    console.log('[issuancesDocumentService] Years:', years);
    console.log('[issuancesDocumentService] Folders:', folders);
    
    // Build tree then flatten for simple list display with indentation
    const buildTree = (list, parentId = null, level = 0) => {
      let tree = [];
      list.filter(f => f.parent_id === parentId).forEach(f => {
        tree.push({
          id: `folder-${f.id}`,
          label: f.name,
          type: 'folder',
          value: f.id,
          level: level,
          parent_id: f.parent_id
        });
        tree = [...tree, ...buildTree(list, f.id, level + 1)];
      });
      return tree;
    };

    const customFolders = buildTree(folders || []);

    const yearFolders = (years || []).map(year => ({ 
      id: `year-${year}`, 
      label: year.toString(), 
      type: 'year',
      value: year,
      level: 0,
      hasChildren: customFolders.some(f => f.level === 1) // Check if any level-1 folders exist
    }));

    console.log('[issuancesDocumentService] Year folders:', yearFolders);
    console.log('[issuancesDocumentService] Custom folders:', customFolders);

    return [...yearFolders, ...customFolders];
  } catch (err) {
    console.error('Error fetching folders:', err);
    throw err;
  }
}

export async function fetchFilesForFolder(folderObj) {
  // folderObj can be a string (id) or the folder object from fetchFolders
  try {
    console.log('[fetchFilesForFolder] Called with:', folderObj);
    let url = '/issuances';
    if (typeof folderObj === 'string') {
      if (folderObj.startsWith('year-')) {
        const year = folderObj.replace('year-', '');
        url += `?series_year=${year}`;
        console.log('[fetchFilesForFolder] Year folder - using series_year:', year);
      } else if (folderObj.startsWith('folder-')) {
        const folderId = folderObj.replace('folder-', '');
        url += `?folder_id=${folderId}`;
        console.log('[fetchFilesForFolder] Custom folder - using folder_id:', folderId);
      } else {
        // Fallback for old calls
        url += `?series_year=${folderObj}`;
        console.log('[fetchFilesForFolder] Fallback - using series_year:', folderObj);
      }
    } else if (folderObj?.type === 'year') {
      url += `?series_year=${folderObj.value}`;
      console.log('[fetchFilesForFolder] Year object - using series_year:', folderObj.value);
    } else if (folderObj?.type === 'folder') {
      url += `?folder_id=${folderObj.value}`;
      console.log('[fetchFilesForFolder] Folder object - using folder_id:', folderObj.value);
    }

    const { data } = await api.get(url);
    return dedupeById(data || []).map(mapIssuanceItem);
  } catch (err) {
    console.error('Error fetching files for folder:', err);
    throw err;
  }
}

export async function searchDocuments(params = {}) {
  try {
    const { q, schoolYear, category_id, dateStart, dateEnd } = params;
    let url = `/issuances?q=${q || ''}`;
    if (schoolYear) url += `&series_year=${schoolYear}`;
    if (category_id) url += `&category_id=${category_id}`;
    if (dateStart) url += `&start_date=${dateStart}`;
    if (dateEnd) url += `&end_date=${dateEnd}`;

    const { data } = await api.get(url);
    return dedupeById(data || []).map(mapIssuanceItem);
  } catch (err) {
    console.error('Error searching documents:', err);
    throw err;
  }
}
export async function fetchCategories() {
  try {
    const { data } = await api.get('/issuances/categories');
    return data || [];
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw err;
  }
}

export async function deleteDocument(documentId) {
  // Not used in public view, but kept for admin if needed
  try {
    await api.delete(`/admin/issuances-mgmt/issuances/${documentId}`);
  } catch (err) {
    console.error('Error deleting document:', err);
    throw err;
  }
}

export async function fetchAdminIssuances(params = {}) {
  try {
    const { data } = await api.get('/admin/issuances-mgmt/issuances', { params });
    return data;
  } catch (err) {
    console.error('Error fetching admin issuances:', err);
    throw err;
  }
}

export async function createDocument(formData) {
  try {
    const { data } = await api.post('/admin/issuances-mgmt/issuances', formData);
    return data;
  } catch (err) {
    console.error('Error creating document:', err);
    throw err;
  }
}

export async function fetchAdminFolders(params = {}) {
  try {
    const { data } = await api.get('/admin/issuances-mgmt/folders', { params });
    return data;
  } catch (err) {
    console.error('Error fetching admin folders:', err);
    throw err;
  }
}

export async function createFolder(folderData) {
  try {
    const { data } = await api.post('/admin/issuances-mgmt/folders', folderData);
    return data;
  } catch (err) {
    console.error('Error creating folder:', err);
    throw err;
  }
}

export async function updateFolder(id, folderData) {
  try {
    const { data } = await api.put(`/admin/issuances-mgmt/folders/${id}`, folderData);
    return data;
  } catch (err) {
    console.error('Error updating folder:', err);
    throw err;
  }
}

export async function deleteFolder(id) {
  try {
    const { data } = await api.delete(`/admin/issuances-mgmt/folders/${id}`);
    return data;
  } catch (err) {
    console.error('Error deleting folder:', err);
    throw err;
  }
}

export async function updateDocument(id, formData) {
  try {
    const { data } = await api.put(`/admin/issuances-mgmt/issuances/${id}`, formData);
    return data;
  } catch (err) {
    console.error('Error updating document:', err);
    throw err;
  }
}

