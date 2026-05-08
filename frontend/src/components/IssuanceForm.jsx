import React, { useState, useEffect, useRef } from 'react';
import { fetchCategories, fetchAdminFolders } from '../services/issuancesDocumentService';
import { useAuth } from '../context/AuthContext';
import './../pages/admin-console.css';

export default function IssuanceForm({ initial = {}, onCancel, onSave }) {
  const { user } = useAuth();

  const getDefaultSignatory = () => {
    if (user) {
      return user.full_name || user.name || user.username || '';
    }
    return '';
  };

  const [formData, setFormData] = useState({
    doc_number: '',
    title: '',
    category_id: '',
    folder_id: initial.folder_id === undefined ? '' : initial.folder_id,
    date_issued: new Date().toISOString().split('T')[0],
    signatory: '',
    series_year: new Date().getFullYear(),
    tags: '',
    description: ''
  });

  useEffect(() => {
    if (user && !formData.signatory) {
      setFormData(prev => ({
        ...prev,
        signatory: user.full_name || user.name || user.username || ''
      }));
    }
  }, [user]);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadCategoriesAndFolders = async () => {
      setLoadingCategories(true);
      try {
        const [catData, folderData] = await Promise.all([
          fetchCategories(),
          fetchAdminFolders()
        ]);
        setCategories(catData);
        setFolders(folderData);
      } catch (err) {
        console.error('Failed to load categories/folders:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategoriesAndFolders();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const sanitizedTitle = baseName.replace(/[-_]/g, ' ').replace(/[^\w\s]/g, '');
      
      setFormData(prev => ({
        ...prev,
        title: prev.title || sanitizedTitle,
        doc_number: prev.doc_number || generateDocNumber(selectedFile)
      }));
      
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: null }));
      }
    }
  };

  const generateDocNumber = (selectedFile) => {
    const year = new Date().getFullYear();
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    const ext = selectedFile.name.split('.').pop()?.toUpperCase() || 'DOC';
    return `DOC-${year}-${randomPart}`;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const sanitizedTitle = baseName.replace(/[-_]/g, ' ').replace(/[^\w\s]/g, '');
      
      setFormData(prev => ({
        ...prev,
        title: prev.title || sanitizedTitle,
        doc_number: prev.doc_number || generateDocNumber(selectedFile)
      }));
      
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: null }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!file) {
      newErrors.file = 'Please select a file to upload';
    }
    
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.folder_id || formData.folder_id === '') {
      newErrors.folder_id = 'Please select a folder';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });
    
    if (file) {
      data.append('files', file);
    }
    
    onSave(data);
  };

  const getFlatFolders = (tree, level = 0) => {
    let flat = [];
    tree.forEach(f => {
      flat.push({ id: f.id, name: `${'—'.repeat(level)} ${f.name}` });
      if (f.children) {
        flat = [...flat, ...getFlatFolders(f.children, level + 1)];
      }
    });
    return flat;
  };

  const isFormValid = file && formData.title.trim() && formData.folder_id;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="modal-header border-0 pb-2 ps-3 pe-2 pt-2" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h5 className="modal-title fw-bold" style={{ fontSize: '1rem', color: '#1e293b' }}>
              {formData.id ? '✏️ Edit' : '📤 Upload'}
            </h5>
            <button type="button" className="btn-close btn-sm" onClick={onCancel} aria-label="Close" style={{ padding: '0.25rem' }}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-2">
              <div className="row g-1">
                {/* File Upload */}
                <div className="col-12">
                  <div 
                    className={`border rounded p-2 text-center ${isDragging ? 'bg-light border-primary' : 'bg-light'} ${errors.file ? 'border-danger' : ''}`}
                    style={{ 
                      border: '2px dashed #cbd5e0', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: isDragging ? '#dbeafe' : '#f8fafc',
                      minHeight: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {file ? (
                      <div className="d-flex align-items-center justify-content-center gap-2 w-100" style={{ flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1rem' }}>📄</span>
                        <div className="text-start flex-grow-1" style={{ minWidth: '120px' }}>
                          <div className="fw-500" style={{ fontSize: '0.75rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-sm"
                          style={{ padding: '0.2rem 0.4rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="text-muted text-center">
                        <div style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>📁 Drag or click</div>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="d-none"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />
                  </div>
                  {errors.file && <div className="text-danger" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.file}</div>}
                </div>

                {/* Title */}
                <div className="col-12">
                  <input
                    type="text"
                    className={`form-control form-control-sm ${errors.title ? 'is-invalid' : ''}`}
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Title *"
                    style={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                    required
                  />
                  {errors.title && <div className="invalid-feedback" style={{ fontSize: '0.7rem' }}>{errors.title}</div>}
                </div>

                {/* Folder */}
                <div className="col-12">
                  <select
                    className={`form-select form-select-sm ${errors.folder_id ? 'is-invalid' : ''}`}
                    name="folder_id"
                    value={formData.folder_id}
                    onChange={handleChange}
                    style={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                    required
                  >
                    <option value="">Folder *</option>
                    {getFlatFolders(folders).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  {errors.folder_id && <div className="invalid-feedback" style={{ fontSize: '0.7rem' }}>{errors.folder_id}</div>}
                </div>

                {/* Doc Number & Type */}
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="doc_number"
                    value={formData.doc_number}
                    onChange={handleChange}
                    placeholder="Doc #"
                    style={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                <div className="col-6">
                  <select
                    className="form-select form-select-sm"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    style={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="">Type</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date & Signatory */}
                <div className="col-6">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    name="date_issued"
                    value={formData.date_issued}
                    onChange={handleChange}
                    style={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="signatory"
                    value={formData.signatory}
                    onChange={handleChange}
                    placeholder="Signatory"
                    style={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                {/* Tags */}
                <div className="col-12">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Tags (optional)"
                    style={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                {/* Description */}
                <div className="col-12">
                  <textarea
                    className="form-control form-control-sm"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="1"
                    placeholder="Description (optional)"
                    style={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      resize: 'none',
                      minHeight: '32px'
                    }}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 p-2 justify-content-end gap-1" style={{ backgroundColor: '#f8fafc' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={onCancel}
                style={{ 
                  fontWeight: '500',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm"
                style={{ 
                  backgroundColor: '#2563eb', 
                  color: 'white',
                  border: 'none', 
                  fontWeight: '500',
                  padding: '0.35rem 0.9rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                  opacity: isFormValid ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
                disabled={!isFormValid}
              >
                {loadingCategories ? 'Loading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
