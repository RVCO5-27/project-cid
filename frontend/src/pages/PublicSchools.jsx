import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllSchools } from '../services/schools';
import { resolveFileUrl } from '../services/api';
import { FaSearch, FaSchool, FaUserTie, FaCalendarAlt, FaBuilding, FaUniversity } from 'react-icons/fa';
import './PublicSchools.css';

export default function PublicSchools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const loadSchools = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      const type = params.get('type');
      
      const query = { search: searchTerm, sortBy: 'school_name', order: 'ASC' };
      if (type) {
        query.type = type.charAt(0).toUpperCase() + type.slice(1);
      }
      
      const data = await getAllSchools(query);
      setSchools(data);
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadSchools();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, location.search]);

  const typeParam = new URLSearchParams(location.search).get('type');
  const pageTitle = typeParam ? `${typeParam.charAt(0).toUpperCase() + typeParam.slice(1)} Schools` : 'Senior High Schools';

  return (
    <div className="public-schools-page container">
      <header className="page-header">
        <h1 className="fw-bold text-primary">{pageTitle}</h1>
        <p className="text-muted">Explore {typeParam || 'public and private'} SHS schools in SDO Cabuyao City</p>
      </header>

      <div className="search-section">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="input-group input-group-lg shadow-sm">
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
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row g-3 g-lg-4">
          {schools.length > 0 ? (
            schools.map((school) => (
              <div key={school.id} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm school-card">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                      <div className="school-icon-wrapper me-3">
                        {school.logo_url ? (
                          <img className="public-school-logo" src={resolveFileUrl(school.logo_url)} alt="" />
                        ) : (
                          <FaSchool />
                        )}
                      </div>
                      <div>
                        <h5 className="card-title mb-0 fw-bold text-dark">{school.school_name}</h5>
                        <small className="text-muted">ID: {school.school_id}</small>
                      </div>
                    </div>
                    
                    <hr className="my-2 opacity-10" />
                    
                    <div className="school-info-item d-flex align-items-center mb-2">
                      <FaUserTie className="text-primary me-2" />
                      <div>
                        <div className="small text-muted">Principal / Head</div>
                        <div className="fw-semibold" style={{ fontSize: '0.95rem' }}>{school.principal_name}</div>
                      </div>
                    </div>
                    
                    <div className="school-info-item d-flex align-items-center mb-2">
                      <FaCalendarAlt className="text-primary me-2" />
                      <div>
                        <div className="small text-muted">Year Established</div>
                        <div className="fw-semibold" style={{ fontSize: '0.95rem' }}>{school.year_started}</div>
                      </div>
                    </div>
                    
                    <div className="mt-2 d-flex justify-content-between align-items-center gap-2">
                      <span className="badge bg-light text-primary border border-primary-subtle px-2 py-1" style={{ fontSize: '0.75rem' }}>
                        {school.designation}
                      </span>
                      <span className={`school-type-badge ${school.school_type.toLowerCase()}`}>
                        {school.school_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-4">
              <div className="text-muted">
                <FaSearch size={48} className="mb-2 opacity-25" />
                <h4>No schools found</h4>
                <p>Try adjusting your search terms</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
