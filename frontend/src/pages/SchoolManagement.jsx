import React, { useState, useEffect } from 'react';
import { getAllSchools, createSchool, updateSchool, deleteSchool, uploadSchoolLogo } from '../services/schools';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilePdf, FaFileExcel, FaTimes, FaSchool, FaUserTie, FaCalendarAlt, FaChevronRight, FaDownload, FaFilter } from 'react-icons/fa';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { resolveFileUrl } from '../services/api';
import './SchoolManagement.css';

export default function SchoolManagement() {
  const { user } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [toast, setToast] = useState(null); // { kind: 'success'|'error'|'info', title, message }
  const [exportingFormat, setExportingFormat] = useState(null); // 'excel' or 'pdf'
  const [exportFilters, setExportFilters] = useState({
    search: '',
    type: '',
    yearFrom: '',
    yearTo: ''
  });
  const [formData, setFormData] = useState({
    school_id: '',
    school_name: '',
    principal_name: '',
    designation: '',
    year_started: new Date().getFullYear().toString(),
    school_type: 'Public'
  });

  const isSuperAdmin = user?.role === 'SuperAdmin';

  const showToast = (nextToast) => {
    setToast(nextToast);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    return () => window.clearTimeout(showToast._t);
  }, []);

  const fieldLabel = (key) => {
    const labels = {
      school_id: 'School ID',
      school_name: 'School Name',
      principal_name: 'Principal / School Head',
      designation: 'Designation',
      year_started: 'Year Established',
      school_type: 'School Type',
      logo_url: 'School Logo',
    };
    return labels[key] || key;
  };

  const getChangedFields = (before, after) => {
    if (!before) return [];
    const keys = [
      'school_id',
      'school_name',
      'principal_name',
      'designation',
      'year_started',
      'school_type',
    ];
    const changed = [];
    for (const k of keys) {
      const a = before?.[k];
      const b = after?.[k];
      // Normalize comparisons for numbers/strings
      const na = a == null ? '' : String(a);
      const nb = b == null ? '' : String(b);
      if (na !== nb) changed.push(fieldLabel(k));
    }
    return changed;
  };

  const patchSchoolInList = (schoolId, patch) => {
    setSchools((prev) =>
      prev.map((s) => (String(s.id) === String(schoolId) ? { ...s, ...patch } : s))
    );
  };

  const loadSchools = async () => {
    setLoading(true);
    try {
      const data = await getAllSchools({
        search: searchTerm,
        type: typeFilter || undefined,
        sortBy: 'school_name',
        order: 'ASC'
      });
      setSchools(data);
    } catch (err) {
      console.error('Failed to load schools:', err);
      showToast({
        kind: 'error',
        title: 'Failed to load schools',
        message: err?.friendlyMessage || err?.response?.data?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadSchools();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, typeFilter]);

  const handleOpenModal = (school = null) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        school_id: school.school_id,
        school_name: school.school_name,
        logo_url: school.logo_url || null,
        principal_name: school.principal_name,
        designation: school.designation,
        year_started: school.year_started.toString(),
        school_type: school.school_type || 'Public'
      });
      setLogoFile(null);
      setLogoPreview(school.logo_url || null);
    } else {
      setEditingSchool(null);
      setFormData({
        school_id: '',
        school_name: '',
        logo_url: null,
        principal_name: '',
        designation: '',
        year_started: new Date().getFullYear().toString(),
        school_type: 'Public'
      });
      setLogoFile(null);
      setLogoPreview(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchool(null);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const sanitizeSchoolId = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPG, PNG, etc.).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Logo file must be 8MB or smaller.');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanedId = sanitizeSchoolId(formData.school_id);
      if (cleanedId.length !== 6) {
        alert('School ID must be exactly 6 digits.');
        return;
      }
      const payload = { ...formData, school_id: cleanedId };
      if (editingSchool) {
        await updateSchool(editingSchool.id, payload);
        const changed = getChangedFields(editingSchool, payload);
        // Immediately reflect edits in the table (better UX than waiting for reload).
        patchSchoolInList(editingSchool.id, payload);
        let logoUploadOk = null; // null = not attempted, true/false = attempted result
        let logoUploadError = null;
        if (logoFile) {
          try {
            const uploadRes = await uploadSchoolLogo(editingSchool.id, logoFile);
            logoUploadOk = true;
            if (!changed.includes('School Logo')) changed.push('School Logo');
            if (uploadRes?.logoUrl) {
              patchSchoolInList(editingSchool.id, { logo_url: uploadRes.logoUrl });
              setLogoPreview(uploadRes.logoUrl);
            }
          } catch (uploadErr) {
            logoUploadOk = false;
            logoUploadError =
              uploadErr?.response?.data?.message ||
              uploadErr?.friendlyMessage ||
              'Could not upload school logo. Please try again.';
          }
        }

        if (logoUploadOk === false) {
          showToast({
            kind: 'error',
            title: 'School updated (logo failed)',
            message: `${changed.length > 0 ? `Updated: ${changed.join(', ')}. ` : ''}${logoUploadError}`,
          });
        } else {
          showToast({
            kind: 'success',
            title: logoUploadOk === true ? 'School updated + logo saved' : 'School updated',
            message: changed.length > 0
              ? `Updated: ${changed.join(', ')}`
              : 'No changes detected, but the record was saved.',
          });
        }
      } else {
        const created = await createSchool(payload);
        const newId = created?.id;
        if (logoFile && newId) {
          try {
            await uploadSchoolLogo(newId, logoFile);
            showToast({
              kind: 'success',
              title: 'Logo uploaded',
              message: 'School logo was uploaded successfully.',
            });
          } catch (uploadErr) {
            showToast({
              kind: 'error',
              title: 'Logo upload failed',
              message:
                uploadErr?.response?.data?.message ||
                uploadErr?.friendlyMessage ||
                'Could not upload school logo. Please try again.',
            });
          }
        }
        showToast({
          kind: 'success',
          title: 'School created',
          message: `Saved "${payload.school_name}" (${payload.school_type}).`,
        });
      }
      handleCloseModal();
      loadSchools();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.friendlyMessage || 'Failed to save school record';
      showToast({ kind: 'error', title: 'Save failed', message: msg });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this school record?')) return;
    try {
      await deleteSchool(id);
      showToast({ kind: 'success', title: 'School deleted', message: 'The school record was removed.' });
      loadSchools();
    } catch (err) {
      showToast({
        kind: 'error',
        title: 'Delete failed',
        message: err?.response?.data?.message || err?.friendlyMessage || 'Failed to delete school record',
      });
    }
  };

  const handleExportFilterChange = (field, value) => {
    setExportFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportModalClose = () => {
    setShowExportModal(false);
    setExportingFormat(null);
  };

  const handleExport = async (format) => {
    setExportingFormat(format);
    try {
      const filters = {
        search: exportFilters.search || searchTerm,
        type: exportFilters.type || '',
        yearFrom: exportFilters.yearFrom || '',
        yearTo: exportFilters.yearTo || ''
      };

      if (format === 'excel') {
        await exportToExcel(filters);
        showToast({
          kind: 'success',
          title: 'Excel export successful',
          message: 'Your school data has been exported to Excel.',
        });
      } else if (format === 'pdf') {
        await exportToPDF(filters);
        showToast({
          kind: 'success',
          title: 'PDF export successful',
          message: 'Your school data has been exported to PDF.',
        });
      }

      handleExportModalClose();
    } catch (err) {
      console.error(`${format.toUpperCase()} export failed:`, err);
      showToast({
        kind: 'error',
        title: `${format.toUpperCase()} export failed`,
        message: err.message || 'Failed to export data. Please try again.',
      });
      setExportingFormat(null);
    }
  };

  return (
    <div className="admin-console school-mgmt-container">
      {toast && (
        <div className={`school-toast school-toast--${toast.kind || 'info'}`} role="status" aria-live="polite">
          <div className="school-toast__title">{toast.title}</div>
          <div className="school-toast__message">{toast.message}</div>
          <button
            type="button"
            className="school-toast__close"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}
      <div className="school-mgmt-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">School Management</h2>
          <p className="text-muted small mb-0">Manage and monitor SHS school records and administrators.</p>
        </div>
        <button className="btn btn-primary btn-lg shadow-sm d-flex align-items-center gap-2 px-4" onClick={() => handleOpenModal()}>
          <FaPlus /> <span>Add School</span>
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6 col-lg-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by School ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <span className="text-muted small">Type</span>
                </span>
                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by school type"
                >
                  <option value="">All</option>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>
            <div className="col-md-12 col-lg-3 d-flex justify-content-lg-end gap-2 school-mgmt-export-actions">
              <button 
                className="btn btn-outline-info btn-sm d-flex align-items-center gap-1" 
                onClick={() => setShowExportModal(true)}
                title="Export data with filters"
              >
                <FaFilter /> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="school-mgmt-table-card">
        <div className="table-responsive">
          <table className="table align-middle mb-0 school-table school-table--fixed">
            <thead>
              <tr>
                <th className="ps-4">Logo</th>
                <th className="ps-4">School ID</th>
                <th>School Name</th>
                <th>Type</th>
                <th>Principal Name</th>
                <th>Designation</th>
                <th>Year Established</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : schools.length > 0 ? (
                schools.map((school) => (
                  <tr key={school.id}>
                    <td className="ps-4">
                      <div className="school-logo">
                        {school.logo_url ? (
                          <img
                            src={`${resolveFileUrl(school.logo_url)}?v=${encodeURIComponent(
                              String(school.logo_url)
                            )}`}
                            alt=""
                          />
                        ) : (
                          <span aria-hidden="true">🏫</span>
                        )}
                      </div>
                    </td>
                    <td className="ps-4 school-id-badge">{school.school_id}</td>
                    <td className="fw-semibold school-name-cell" title={school.school_name}>{school.school_name}</td>
                    <td>
                      <span className={`school-type-badge ${school.school_type.toLowerCase()}`}>
                        {school.school_type}
                      </span>
                    </td>
                    <td className="school-principal-cell" title={school.principal_name}>{school.principal_name}</td>
                    <td><span className="designation-pill">{school.designation}</span></td>
                    <td>{school.year_started}</td>
                    <td className="pe-4">
                      <div className="action-btns">
                        <button 
                          className="btn-action-custom edit" 
                          title="Edit School"
                          onClick={() => handleOpenModal(school)}
                          disabled={!isSuperAdmin && school.created_by !== user?.id}
                        >
                          <FaEdit />
                        </button>
                        {isSuperAdmin && (
                          <button 
                            className="btn-action-custom delete" 
                            title="Delete School"
                            onClick={() => handleDelete(school.id)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="opacity-25 mb-2"><FaSchool size={48} /></div>
                    No school records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Filter Modal */}
      <div className={`modal fade ${showExportModal ? 'show' : ''}`} style={{ display: showExportModal ? 'block' : 'none' }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <FaFilter className="me-2" /> Export School Data
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={handleExportModalClose}
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Search Term</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by School ID or Name..."
                  value={exportFilters.search}
                  onChange={(e) => handleExportFilterChange('search', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">School Type</label>
                <select
                  className="form-select"
                  value={exportFilters.type}
                  onChange={(e) => handleExportFilterChange('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Year From</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 1990"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={exportFilters.yearFrom}
                    onChange={(e) => handleExportFilterChange('yearFrom', e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Year To</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 2024"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={exportFilters.yearTo}
                    onChange={(e) => handleExportFilterChange('yearTo', e.target.value)}
                  />
                </div>
              </div>

              <div className="alert alert-info alert-sm" role="alert">
                <small>
                  Leave filters blank to export all records. Filters will be applied to the exported data.
                </small>
              </div>
            </div>

            <div className="modal-footer border-top">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleExportModalClose}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-success d-flex align-items-center gap-2" 
                onClick={() => handleExport('excel')}
                disabled={exportingFormat !== null}
              >
                <FaFileExcel /> {exportingFormat === 'excel' ? 'Exporting...' : 'Export to Excel'}
              </button>
              <button 
                type="button" 
                className="btn btn-danger d-flex align-items-center gap-2" 
                onClick={() => handleExport('pdf')}
                disabled={exportingFormat !== null}
              >
                <FaFilePdf /> {exportingFormat === 'pdf' ? 'Exporting...' : 'Export to PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showExportModal && <div className="modal-backdrop fade show"></div>}

      {/* Side Sheet Modal */}
      <div className={`side-sheet-container ${showModal ? 'open' : ''}`}>
        <div className="side-sheet-overlay" onClick={handleCloseModal}></div>
        <div className="side-sheet-content">
          <div className="side-sheet-header">
            <h3>{editingSchool ? 'Edit School Record' : 'Add New School'}</h3>
            <button className="side-sheet-close" onClick={handleCloseModal}>
              <FaTimes />
            </button>
          </div>
          
          <div className="side-sheet-body">
            <form id="schoolForm" onSubmit={handleSubmit} className="school-form-grid">
              <div className="form-group-custom">
                <label>School Logo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control-custom"
                  onChange={handleLogoChange}
                />
                {logoPreview && (
                  <div className="school-logo-preview">
                    <img src={logoPreview} alt="" />
                  </div>
                )}
              </div>
              <div className="form-group-custom">
                <label>School Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSchool className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Official school name..."
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group-custom">
                  <label>School ID</label>
                  <input
                    type="text"
                    className="form-control-custom"
                    placeholder="e.g. 301234"
                    value={formData.school_id}
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(e) => setFormData({ ...formData, school_id: sanitizeSchoolId(e.target.value) })}
                    required
                  />
                  <small className="text-muted">6 digits only</small>
                </div>
                <div className="form-group-custom">
                  <label>School Type</label>
                  <select
                    className="form-control-custom"
                    value={formData.school_type}
                    onChange={(e) => setFormData({ ...formData, school_type: e.target.value })}
                    required
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              <div className="form-group-custom">
                <label>Principal / School Head</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaUserTie className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Full name of principal..."
                    value={formData.principal_name}
                    onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group-custom">
                  <label>Designation</label>
                  <input
                    type="text"
                    className="form-control-custom"
                    placeholder="e.g. Principal II"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-custom">
                  <label>Year Established</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <FaCalendarAlt className="text-muted" />
                    </span>
                    <input
                      type="number"
                      className="form-control border-start-0 ps-0"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.year_started}
                      onChange={(e) => setFormData({ ...formData, year_started: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="side-sheet-footer">
            <button type="button" className="btn-cancel-full" onClick={handleCloseModal}>
              Cancel
            </button>
            <button type="submit" form="schoolForm" className="btn-save-full">
              {editingSchool ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
