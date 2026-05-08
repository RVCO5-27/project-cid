import React, { useState, useEffect, useCallback } from 'react';
import { getAllAuditLogs, exportAuditLogs } from '../services/auditLogs';
import {
  FaHistory,
  FaSearch,
  FaFilter,
  FaEye,
  FaDownload,
  FaSyncAlt,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import {
  labelForAction,
  displayPersonName,
  statusDisplay,
  isAttentionAction,
} from '../utils/auditActionLabels';
import { formatIpDisplay } from '../utils/formatIp';
import { friendlyHttpMessage } from '../utils/httpMessages';
import './admin-console.css';
import './AuditLogManagement.css';

const PAGE_SIZE = 15;

export default function AuditLogManagement() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [exportError, setExportError] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAllAuditLogs({
        search: searchTerm,
        actionType: filterType,
        status: filterStatus,
        page,
        limit: PAGE_SIZE,
      });
      setLogs(data.data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setLogs([]);
      setLoadError(err.friendlyMessage || friendlyHttpMessage(err));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterType, filterStatus, page]);

  useEffect(() => {
    const t = setTimeout(() => loadLogs(), 450);
    return () => clearTimeout(t);
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, filterStatus]);

  const renderValue = (val) => {
    if (!val || val === 'null') return '—';
    try {
      const parsed = JSON.parse(val);
      return (
        <pre className="small mb-0 p-2 bg-light rounded" style={{ fontSize: '0.9rem' }}>
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return val;
    }
  };

  const goExport = async () => {
    setExportBusy(true);
    setExportError(null);
    try {
      await exportAuditLogs({
        search: searchTerm,
        actionType: filterType,
        status: filterStatus,
      });
      setExportConfirmOpen(false);
    } catch (e) {
      setExportError(e.friendlyMessage || friendlyHttpMessage(e));
    } finally {
      setExportBusy(false);
    }
  };

  const resultPillClass = (log) => {
    const { tone } = statusDisplay(log.status);
    if (tone === 'success') return 'audit-pill audit-pill--success';
    if (tone === 'danger') return 'audit-pill audit-pill--danger';
    return 'audit-pill audit-pill--neutral';
  };

  const actionPillClass = (log) => {
    if (isAttentionAction(log.action_type)) return 'audit-pill audit-pill--warn';
    if (log.status === 'FAILED') return 'audit-pill audit-pill--danger';
    return 'audit-pill audit-pill--neutral';
  };

  return (
    <div className="admin-console audit-page py-2">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="audit-page__title d-flex align-items-center gap-2 mb-2">
            <FaHistory className="text-muted" aria-hidden />
            Activity Log
          </h1>
          <p className="audit-page__lead mb-0">
            Green means success. Red means a failed attempt or blocked action. Yellow means a security
            event worth a quick look. This list helps supervisors review who did what, and when.
          </p>
        </div>
        <div className="audit-actions" role="toolbar" aria-label="Activity log actions">
          <button
            type="button"
            className="audit-btn audit-btn--secondary"
            onClick={() => loadLogs()}
            disabled={loading}
            aria-busy={loading}
          >
            <FaSyncAlt className={loading ? 'audit-btn__icon audit-btn__icon--spin' : 'audit-btn__icon'} aria-hidden />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            className="audit-btn audit-btn--primary"
            onClick={() => {
              setExportError(null);
              setExportConfirmOpen(true);
            }}
          >
            <FaDownload className="audit-btn__icon" aria-hidden />
            Download spreadsheet
          </button>
        </div>
      </div>

      {loadError && (
        <div className="audit-load-error" role="alert">
          {loadError}
        </div>
      )}

      <div className="card mb-4 border-0 shadow-sm audit-toolbar">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label small text-muted mb-1">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaSearch className="text-muted" aria-hidden />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Name, description, or record…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted mb-1">Type of activity</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaFilter className="text-muted" aria-hidden />
                </span>
                <select
                  className="form-select border-start-0 ps-0"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All types</option>
                  <option value="LOGIN">Sign-in</option>
                  <option value="LOGOUT">Sign-out</option>
                  <option value="PERMISSION_DENIED">Access not allowed</option>
                  <option value="CREATE">Added information</option>
                  <option value="UPDATE">Changed information</option>
                  <option value="DELETE">Removed information</option>
                  <option value="UPLOAD">File upload</option>
                  <option value="DOWNLOAD">Download</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label small text-muted mb-1">Result</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All results</option>
                <option value="SUCCESS">Succeeded</option>
                <option value="FAILED">Did not succeed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="audit-table-card">
        <div className="table-responsive">
          <table className="table align-middle audit-table mb-0">
            <thead>
              <tr>
                <th className="ps-4 audit-col-date audit-table__th text-start">Date &amp; time</th>
                <th className="audit-table__th">User</th>
                <th className="audit-table__th">Action</th>
                <th className="audit-table__th">Status</th>
                <th className="audit-table__th">IP address</th>
                <th className="text-end pe-4 audit-table__th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading…</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const { text: statusText } = statusDisplay(log.status);
                  const actionLabel = labelForAction(log.action_type);
                  return (
                    <tr key={log.id}>
                      <td className="ps-4 audit-col-date text-muted">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <div className="audit-person">{displayPersonName(log)}</div>
                        {log.username && log.full_name && (
                          <div className="audit-person__sub">@{log.username}</div>
                        )}
                      </td>
                      <td>
                        <span className={actionPillClass(log)}>{actionLabel}</span>
                      </td>
                      <td>
                        <span className={resultPillClass(log)}>{statusText}</span>
                      </td>
                      <td className="audit-ip">{formatIpDisplay(log.ip_address)}</td>
                      <td className="text-end pe-4">
                        <button
                          type="button"
                          className="audit-btn audit-btn--icon"
                          onClick={() => setSelectedLog(log)}
                          aria-label="View details"
                          title="View details"
                        >
                          <FaEye aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No records match your search. Try clearing filters or pick another page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && pagination.total > 0 && (
          <div className="audit-pagination">
            <span>
              Page <strong>{pagination.page}</strong> of <strong>{Math.max(1, pagination.pages)}</strong>
              <span className="text-muted"> ({pagination.total} records)</span>
            </span>
            <div className="audit-pagination__btns">
              <button
                type="button"
                className="audit-btn audit-btn--page"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <FaChevronLeft className="audit-btn__icon" aria-hidden />
                Previous
              </button>
              <button
                type="button"
                className="audit-btn audit-btn--page"
                disabled={page >= (pagination.pages || 1)}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                Next
                <FaChevronRight className="audit-btn__icon" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {exportConfirmOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-dialog-centered audit-modal">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h2 className="modal-title h5">Download activity spreadsheet?</h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => !exportBusy && setExportConfirmOpen(false)}
                />
              </div>
              <div className="modal-body">
                {exportError && (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    {exportError}
                  </div>
                )}
                <p className="mb-0">
                  This saves a copy of the activity log to your computer. Only use this for official
                  records. The download will also be noted in this log.
                </p>
              </div>
              <div className="modal-footer bg-light audit-modal__footer">
                <button
                  type="button"
                  className="audit-btn audit-btn--ghost"
                  disabled={exportBusy}
                  onClick={() => setExportConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="audit-btn audit-btn--primary audit-btn--wide"
                  disabled={exportBusy}
                  onClick={goExport}
                >
                  {exportBusy ? 'Preparing…' : 'Yes, download'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered audit-modal">
            <div className="modal-content border-0 shadow-lg">
              <div className={`modal-header ${selectedLog.status === 'FAILED' ? 'bg-danger text-white' : 'bg-dark text-white'}`}>
                <div>
                  <h2 className="modal-title h5">Details</h2>
                  <small className="d-block opacity-75">{selectedLog.description || '—'}</small>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setSelectedLog(null)}
                />
              </div>
              <div className="modal-body p-4">
                <div className="row mb-3 pb-3 border-bottom g-3">
                  <div className="col-md-6">
                    <p className="text-muted small mb-1">Who</p>
                    <p className="fw-semibold mb-0 fs-5">{displayPersonName(selectedLog)}</p>
                  </div>
                  <div className="col-md-3">
                    <p className="text-muted small mb-1">Result</p>
                    <span className={resultPillClass(selectedLog)}>{statusDisplay(selectedLog.status).text}</span>
                  </div>
                  <div className="col-md-3">
                    <p className="text-muted small mb-1">When</p>
                    <p className="fw-semibold mb-0">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="row mb-3 g-3">
                  <div className="col-md-6">
                    <p className="text-muted small mb-1">Activity</p>
                    <p className="fw-semibold mb-0">{labelForAction(selectedLog.action_type)}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="text-muted small mb-1">Area</p>
                    <p className="fw-semibold mb-0">{selectedLog.module || '—'}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-muted small mb-1">IP address</p>
                  <p className="fw-semibold mb-0 audit-ip">{formatIpDisplay(selectedLog.ip_address) || 'Not recorded'}</p>
                </div>

                {(selectedLog.old_value || selectedLog.new_value) && (
                  <div className="row g-4 mt-1">
                    {selectedLog.old_value && (
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded border h-100">
                          <h3 className="h6 fw-bold text-secondary mb-3 border-bottom pb-2">Before</h3>
                          {renderValue(selectedLog.old_value)}
                        </div>
                      </div>
                    )}
                    {selectedLog.new_value && (
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded border h-100">
                          <h3 className="h6 fw-bold text-secondary mb-3 border-bottom pb-2">After</h3>
                          {renderValue(selectedLog.new_value)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedLog.diff_snapshot && (
                  <div className="mt-4 pt-3 border-top">
                    <h3 className="h6 fw-bold mb-3">Summary of changes</h3>
                    <div className="p-3 bg-light rounded border">{renderValue(selectedLog.diff_snapshot)}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light audit-modal__footer">
                <button
                  type="button"
                  className="audit-btn audit-btn--secondary audit-btn--wide"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
