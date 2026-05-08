import React, { useState, useEffect } from 'react';
import { 
  fetchAdminIssuances, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  fetchCategories,
  fetchAdminFolders,
  createFolder,
  updateFolder,
  deleteFolder
} from '../services/issuancesDocumentService';
import IssuanceForm from '../components/IssuanceForm';

export default function IssuanceManagement() {
  const [issuances, setIssuances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [search, setSearch] = useState('');
  const [folderForm, setFolderForm] = useState({ name: '', description: '', parent_id: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { q: search };
      if (activeFolder) params.folder_id = activeFolder;

      const [res, catRes, folderRes] = await Promise.all([
        fetchAdminIssuances(params),
        fetchCategories(),
        fetchAdminFolders()
      ]);
      setIssuances(res.data || []);
      setCategories(catRes || []);
      setFolders(folderRes || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, activeFolder]);

  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEdit = (iss) => {
    setEditing(iss);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(id);
      await loadData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editing && editing.id) {
        await updateDocument(editing.id, formData);
      } else {
        await createDocument(formData);
      }
      setShowModal(false);
      setEditing(null);
      await loadData();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddFolder = () => {
    setEditingFolder(null);
    setFolderForm({ name: '', description: '', parent_id: activeFolder || '' });
    setShowFolderModal(true);
  };

  const handleEditFolder = (f) => {
    setEditingFolder(f);
    setFolderForm({ name: f.name, description: f.description || '', parent_id: f.parent_id || '' });
    setShowFolderModal(true);
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this folder? All documents inside will be unassigned.')) return;
    try {
      await deleteFolder(id);
      if (activeFolder === id) setActiveFolder(null);
      await loadData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSaveFolder = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...folderForm };
      if (payload.parent_id === '') payload.parent_id = null;

      if (editingFolder) {
        await updateFolder(editingFolder.id, payload);
      } else {
        await createFolder(payload);
      }
      setShowFolderModal(false);
      await loadData();
    } catch (err) {
      alert('Folder save failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const renderFolderTree = (tree, level = 0) => {
    return tree.map(f => (
      <React.Fragment key={f.id}>
        <div 
          className={`d-flex align-items-center list-group-item list-group-item-action border-0 p-0 ${activeFolder === f.id ? 'bg-light' : ''}`}
          style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          <button 
            className={`btn btn-link text-decoration-none text-start flex-grow-1 py-2 pe-2 ${activeFolder === f.id ? 'fw-bold text-primary' : 'text-dark'}`}
            style={{ paddingLeft: `${(level + 1) * 1}rem`, fontSize: '0.95rem' }}
            onClick={() => setActiveFolder(f.id)}
          >
            {level > 0 ? '↳ ' : ''}📁 {f.name}
          </button>
          <div className="pe-2 d-flex gap-1">
            <button className="btn btn-sm btn-link text-muted p-1" onClick={() => handleEditFolder(f)}>✏️</button>
            <button className="btn btn-sm btn-link text-danger p-1" onClick={() => handleDeleteFolder(f.id)}>🗑️</button>
          </div>
        </div>
        {f.children && f.children.length > 0 && renderFolderTree(f.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Flatten tree for parent selection dropdown
  const getFlatFolders = (tree, level = 0) => {
    let flat = [];
    tree.forEach(f => {
      flat.push({ id: f.id, name: `${'-'.repeat(level)} ${f.name}` });
      if (f.children) {
        flat = [...flat, ...getFlatFolders(f.children, level + 1)];
      }
    });
    return flat;
  };

  return (
    <div className="admin-console p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Issuances & Folder Management</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={handleAddFolder}>
            📁 New Folder
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            ➕ Upload Document
          </button>
        </div>
      </div>

      <div className="row">
        {/* Folder Sidebar */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white fw-bold py-3">
              Folders
            </div>
            <div className="list-group list-group-flush">
              <button 
                className={`list-group-item list-group-item-action py-3 ${!activeFolder ? 'active fw-bold' : ''}`}
                onClick={() => setActiveFolder(null)}
              >
                📁 All Documents
              </button>
              {renderFolderTree(folders)}
            </div>
          </div>
        </div>

        {/* Document Table */}
        <div className="col-md-9">
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-body">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">🔍</span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Search by title, doc number, or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : (
            <div className="table-responsive bg-white rounded shadow-sm">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Doc Number</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Folder</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issuances.length > 0 ? (
                    issuances.map((iss) => (
                      <tr key={iss.id}>
                        <td><code className="fw-bold">{iss.doc_number}</code></td>
                        <td>{iss.title}</td>
                        <td>
                          <span className="badge bg-info text-dark">
                            {iss.category_name || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted small">
                            {iss.folder_name || 'Unassigned'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => handleEdit(iss)}>Edit</button>
                            <button className="btn btn-outline-danger" onClick={() => handleDelete(iss.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center p-5 text-muted">No documents found in this folder.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Document Modal */}
      {showModal && (
        <IssuanceForm
          initial={editing || { folder_id: activeFolder || '' }}
          onCancel={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingFolder ? 'Edit Folder' : 'Create New Folder'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowFolderModal(false)}></button>
              </div>
              <form onSubmit={handleSaveFolder}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-uppercase">Folder Name</label>
                    <input 
                      type="text" 
                      className="form-control form-control-lg" 
                      value={folderForm.name}
                      onChange={(e) => setFolderForm({...folderForm, name: e.target.value})}
                      placeholder="e.g., 2026, Memoranda"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-uppercase">Parent Folder</label>
                    <select 
                      className="form-select"
                      value={folderForm.parent_id}
                      onChange={(e) => setFolderForm({...folderForm, parent_id: e.target.value})}
                    >
                      <option value="">None (Top Level)</option>
                      {getFlatFolders(folders).filter(f => !editingFolder || f.id !== editingFolder.id).map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-bold small text-uppercase">Description (Optional)</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={folderForm.description}
                      onChange={(e) => setFolderForm({...folderForm, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light border px-4" onClick={() => setShowFolderModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">Save Folder</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
