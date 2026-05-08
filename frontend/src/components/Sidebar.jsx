import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllSchools } from '../services/schools';
import { resolveFileUrl } from '../services/api';
import { 
  FaHome, 
  FaInfoCircle, 
  FaSitemap, 
  FaBook, 
  FaFileAlt, 
  FaSchool, 
  FaLock, 
  FaChartBar, 
  FaUsers, 
  FaFolderOpen, 
  FaEdit, 
  FaImage, 
  FaTree, 
  FaGlobe, 
  FaSignOutAlt,
  FaChevronRight,
  FaChevronDown,
  FaExternalLinkAlt,
  FaBuilding,
  FaUniversity,
  FaHistory,
  FaTimes
} from 'react-icons/fa';
import './Sidebar.css';

export default function Sidebar({ isOpen = false, variant = 'public' }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [schoolsModalOpen, setSchoolsModalOpen] = useState(false);
  const [selectedSchoolType, setSelectedSchoolType] = useState('public');
  const [realSchools, setRealSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [lastTriggerId, setLastTriggerId] = useState(null);

  const schoolsItems = [
    { id: 'public', label: 'Public Schools', to: '/schools?type=public', icon: <FaSchool /> },
    { id: 'private', label: 'Private Schools', to: '/schools?type=private', icon: <FaBuilding /> },
  ];

  // Fetch real schools from API
  useEffect(() => {
    if (schoolsModalOpen) {
      const loadSchools = async () => {
        setLoadingSchools(true);
        try {
          // Fetch schools with the correct type filter ('Public' or 'Private') and pagination
          const response = await getAllSchools({ 
            type: selectedSchoolType.charAt(0).toUpperCase() + selectedSchoolType.slice(1),
            sortBy: 'school_name',
            order: 'ASC',
            page: pagination.page,
            limit: pagination.limit
          });
          
          if (response.pagination) {
            setRealSchools(response.data);
            setPagination(prev => ({
              ...prev,
              total: response.pagination.total,
              totalPages: response.pagination.totalPages
            }));
          } else {
            setRealSchools(response);
          }
        } catch (err) {
          console.error('Failed to load sidebar schools:', err);
          setRealSchools([]);
        } finally {
          setLoadingSchools(false);
        }
      };
      loadSchools();
    }
  }, [schoolsModalOpen, selectedSchoolType, pagination.page]);

  const handleDropdown = (id) => {
    setDropdownOpen(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const openSchoolsModal = (type) => {
    setDropdownOpen((prev) => ({
      ...prev,
      schools: false,
    }));
    setLastTriggerId(type);
    setSelectedSchoolType(type);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSchoolsModalOpen(true);
  };

  const closeSchoolsModal = () => {
    setSchoolsModalOpen(false);
  };

  const location = useLocation();
  const navigate = useNavigate();
  const modalCloseBtnRef = useRef(null);
  const schoolTriggerRefs = useRef({});

  useEffect(() => {
    if (!schoolsModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timeout = setTimeout(() => {
      modalCloseBtnRef.current?.focus();
    }, 0);

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        closeSchoolsModal();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      clearTimeout(timeout);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEsc);
      if (lastTriggerId && schoolTriggerRefs.current[lastTriggerId]) {
        schoolTriggerRefs.current[lastTriggerId].focus();
      }
    };
  }, [schoolsModalOpen, lastTriggerId]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && (pagination.totalPages === 0 || newPage <= pagination.totalPages)) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const schoolsModal = schoolsModalOpen ? (
    <div
      className="schools-modal-backdrop"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          closeSchoolsModal();
        }
      }}
    >
      <div className="modal-dialog modal-dialog-scrollable schools-modal-dialog">
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="modal-header schools-modal-header border-bottom">
            <div className="d-flex align-items-center gap-3">
              <div className="schools-modal-icon-container">
                {selectedSchoolType === 'public' ? <FaUniversity /> : <FaBuilding />}
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">
                  {selectedSchoolType === 'public' ? 'Public Schools' : 'Private Schools'} Details
                </h5>
                <p className="text-muted small mb-0">Total of {pagination.total || realSchools.length} records found</p>
              </div>
            </div>
            <button
              ref={modalCloseBtnRef}
              type="button"
              className="schools-modal-close-btn"
              onClick={closeSchoolsModal}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
          <div className="modal-body p-0 schools-modal-scroll">
            <div className="table-responsive">
              <table className="table align-middle mb-0 image-reference-table">
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>ID</th>
                    <th>School Name</th>
                    <th>Principal / School Head</th>
                    <th>Designation</th>
                    <th className="text-end">Year Established</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSchools ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : realSchools.length > 0 ? (
                    realSchools.map((school) => (
                      <tr key={school.id}>
                        <td>
                          <div className="schools-modal-logo">
                            {school.logo_url ? <img src={resolveFileUrl(school.logo_url)} alt="" /> : <span aria-hidden="true">🏫</span>}
                          </div>
                        </td>
                        <td className="fw-bold text-primary">{school.school_id}</td>
                        <td className="fw-medium text-dark text-truncate" title={school.school_name} style={{ maxWidth: 320 }}>
                          {school.school_name}
                        </td>
                        <td>{school.principal_name}</td>
                        <td>
                          <span className="text-muted">{school.designation}</span>
                        </td>
                        <td className="text-end font-monospace">{school.year_started}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <div className="mb-2 fs-2 opacity-25">📁</div>
                        No {selectedSchoolType} schools found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="modal-footer schools-modal-footer bg-light border-top d-flex justify-content-between align-items-center py-2 px-4">
              <div className="text-muted small">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </div>
              <nav aria-label="School pagination">
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link rounded-circle border-0" 
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      &laquo;
                    </button>
                  </li>
                  
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Only show limited page numbers if there are many
                    if (
                      pagination.totalPages <= 7 || 
                      pageNum === 1 || 
                      pageNum === pagination.totalPages || 
                      (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                    ) {
                      return (
                        <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                          <button 
                            className="page-link rounded-circle border-0" 
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    } else if (
                      (pageNum === 2 && pagination.page > 3) || 
                      (pageNum === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                    ) {
                      return <li key={pageNum} className="page-item disabled"><span className="page-link border-0 bg-transparent">...</span></li>;
                    }
                    return null;
                  })}

                  <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link rounded-circle border-0" 
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const adminNav = (
    <ul className="menu menu--admin">
      <li className={location.pathname === '/admin/dashboard' ? 'active' : ''}>
        <NavLink to="/admin/dashboard">
          <span className="icon"><FaChartBar /></span>
          <span>Dashboard</span>
        </NavLink>
      </li>
      <li className={location.pathname === '/admin/users' ? 'active' : ''}>
        <NavLink to="/admin/users">
          <span className="icon"><FaUsers /></span>
          <span>Users</span>
        </NavLink>
      </li>
      <li className={location.pathname === '/admin/issuances-mgmt' ? 'active' : ''}>
        <NavLink to="/admin/issuances-mgmt">
          <span className="icon"><FaFolderOpen /></span>
          <span>Issuances Mgmt</span>
        </NavLink>
      </li>
      {user?.role === 'SuperAdmin' && (
        <li className={location.pathname === '/admin/schools' ? 'active' : ''}>
          <NavLink to="/admin/schools">
            <span className="icon"><FaUniversity /></span>
            <span>School Management</span>
          </NavLink>
        </li>
      )}
      {user?.role === 'SuperAdmin' && (
        <li className={location.pathname === '/admin/audit-logs' ? 'active' : ''}>
          <NavLink to="/admin/audit-logs">
            <span className="icon"><FaHistory /></span>
            <span>Activity Log</span>
          </NavLink>
        </li>
      )}
      <li className="dropdown">
        <div className={`menu-item ${location.pathname.startsWith('/admin/carousel') || location.pathname.startsWith('/admin/organizational-chart') ? 'active' : ''}`} onClick={() => handleDropdown('cms')}>
          <span className="icon"><FaEdit /></span>
          <span>Content Management</span>
          <span className="arrow">{dropdownOpen['cms'] ? <FaChevronDown /> : <FaChevronRight />}</span>
        </div>
        {dropdownOpen['cms'] && (
          <ul className="submenu">
            <li>
              <NavLink to="/admin/carousel">
                <span className="icon"><FaImage /></span>
                <span>Carousel</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/organizational-chart">
                <span className="icon"><FaTree /></span>
                <span>Org Chart</span>
              </NavLink>
            </li>
          </ul>
        )}
      </li>
      <li>
        <NavLink to="/home">
          <span className="icon"><FaGlobe /></span>
          <span>Public site</span>
          <span className="arrow"><FaExternalLinkAlt /></span>
        </NavLink>
      </li>
      <li>
        <button
          type="button"
          className="menu-item menu-item--logout"
          onClick={async () => {
            await logout();
            navigate('/admin/login', { replace: true });
          }}
        >
          <span className="icon"><FaSignOutAlt /></span>
          <span>Log out</span>
        </button>
      </li>
    </ul>
  );

  const publicNav = (
    <ul className="menu">
      <li className={location.pathname === '/' || location.pathname === '/home' ? 'active' : ''}>
        <NavLink to="/home">
          <span className="icon"><FaHome /></span>
          <span>Home</span>
        </NavLink>
      </li>
      <li className={location.pathname === '/about' ? 'active' : ''}>
        <NavLink to="/about">
          <span className="icon"><FaInfoCircle /></span>
          <span>About</span>
        </NavLink>
      </li>
      <li className={location.pathname === '/org-chart' ? 'active' : ''}>
        <NavLink to="/org-chart">
          <span className="icon"><FaSitemap /></span>
          <span>Organizational Chart</span>
        </NavLink>
      </li>
      <li>
        <a href="https://www.deped.gov.ph/strengthened-shs-program/" target="_blank" rel="noreferrer">
          <span className="icon"><FaBook /></span>
          <span>Strengthened SHS Program</span>
          <span className="arrow"><FaExternalLinkAlt /></span>
        </a>
      </li>
      <li className={location.pathname === '/issuances' ? 'active' : ''}>
        <NavLink to="/issuances">
          <span className="icon"><FaFileAlt /></span>
          <span>Issuances</span>
        </NavLink>
      </li>
      <li className="dropdown">
        <div className="menu-item" onClick={() => handleDropdown('schools')}>
          <span className="icon"><FaSchool /></span>
          <span>Schools</span>
          <span className="arrow">{dropdownOpen['schools'] ? <FaChevronDown /> : <FaChevronRight />}</span>
        </div>
        {dropdownOpen['schools'] && (
          <ul className="submenu">
            {schoolsItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.to}
                  ref={(el) => {
                    schoolTriggerRefs.current[item.id] = el;
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    openSchoolsModal(item.id);
                  }}
                >
                  <span className="school-type-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    </ul>
  );

  return (
    <div className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${variant === 'admin' ? 'sidebar--admin' : ''}`} id="sidebar">
      <div className="branding">
        <img src="/SDO-Cabuyao.jpg" alt="SDO Cabuyao Logo" className="logo" />
      </div>
      {variant === 'admin' ? adminNav : publicNav}
      {variant !== 'admin' && schoolsModal && createPortal(schoolsModal, document.body)}
    </div>
  );
}
