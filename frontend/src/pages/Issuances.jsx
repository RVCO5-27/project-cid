import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import './issuances-dashboard.css';
import {
  fetchFolders,
  fetchFilesForFolder,
  searchDocuments,
  fetchCategories,
  deleteDocument,
} from '../services/issuancesDocumentService';

/**
 * Issuances — public portal for official documents and memoranda.
 * Connected to the MySQL backend through issuancesDocumentService.
 */
export default function Issuances() {
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('all');
  const [folders, setFolders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState({
    schoolYear: '',
    category_id: '',
    dateStart: '',
    dateEnd: '',
  });

  const searchFromUrl = searchParams.get('search') || '';
  const typeParam = searchParams.get('type');

  const [recentHighlights, setRecentHighlights] = useState([]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        console.log('[Issuances] Loading initial data...');
        const [folderData, categoryData, allDocs] = await Promise.all([
          fetchFolders(),
          fetchCategories(),
          searchDocuments({ q: '' })
        ]);
        
        console.log('[Issuances] Folders loaded:', folderData);
        console.log('[Issuances] Categories loaded:', categoryData);
        console.log('[Issuances] All docs loaded:', allDocs);
        
        setFolders(folderData);
        setCategories(categoryData);
        
        // Use top 3 most recent documents for highlights
        const highlights = allDocs.slice(0, 3).map(doc => ({
          badge: doc.category_prefix || 'NEW',
          title: doc.name
        }));
        setRecentHighlights(highlights);
        
        if (folderData && folderData.length > 0) {
          console.log('[Issuances] Setting active folder to:', folderData[0].id);
          setActiveFolder(folderData[0].id);
        }
      } catch (error) {
        console.error('[Issuances] Error loading initial data:', error);
        setError('Failed to load data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!activeFolder) return;
    let mounted = true;
    const loadFiles = async () => {
      setLoading(true);
      try {
        console.log('[Issuances] Loading files for folder:', activeFolder);
        const docs = await fetchFilesForFolder(activeFolder);
        console.log('[Issuances] Files loaded:', docs);
        if (mounted) setFiles(docs);
      } catch (error) {
        console.error('[Issuances] Error loading files:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadFiles();
    return () => {
      mounted = false;
    };
  }, [activeFolder]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setLoading(true);
      try {
        const results = await searchDocuments({ q: query, ...filterValues });
        setFiles(results);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    } else if (activeFolder) {
      setLoading(true);
      try {
        const docs = await fetchFilesForFolder(activeFolder);
        setFiles(docs);
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  /** Header / shared links: /issuances?search=… */
  useEffect(() => {
    if (!folders.length || !searchFromUrl) return;
    let cancelled = false;
    (async () => {
      setSearchQuery(searchFromUrl);
      setLoading(true);
      try {
        const results = await searchDocuments({
          q: searchFromUrl,
          ...filterValues,
        });
        if (!cancelled) setFiles(results);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folders.length, searchFromUrl]);

  const handleFilterChange = async (filterType, value) => {
    const newFilters = { ...filterValues, [filterType]: value };
    setFilterValues(newFilters);

    setLoading(true);
    try {
      const results = await searchDocuments({
        q: searchQuery,
        ...newFilters,
      });
      setFiles(results);
    } catch (error) {
      console.error('Error filtering:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayFiles = useMemo(() => {
    let list = files || [];
    const typeParam = searchParams.get('type');

    console.log('[Issuances] displayFiles computing, files:', files, 'activeFilter:', activeFilter, 'typeParam:', typeParam);

    if (typeParam === 'advisories') {
      list = list.filter((f) => /advisory/i.test(f.category || f.name));
    } else if (typeParam === 'memoranda') {
      list = list.filter((f) => /memo|memoranda|division/i.test(f.category || f.name));
    } else if (typeParam === 'policies') {
      list = list.filter((f) => /policy/i.test(f.category || f.name));
    }

    if (activeFilter === 'pdfs') {
      list = list.filter((f) => f.type === 'pdf' || /\.pdf$/i.test(f.name));
    } else if (activeFilter === 'policies') {
      list = list.filter((f) => /policy/i.test(f.category || f.name));
    } else if (activeFilter === 'memos') {
      list = list.filter((f) => /memo|memoranda|division/i.test(f.category || f.name));
    }

    console.log('[Issuances] displayFiles result:', list);
    return list;
  }, [files, activeFilter, searchParams]);

  const contextHint = useMemo(() => {
    if (searchFromUrl.trim()) {
      return `Search active: “${searchFromUrl.trim()}”`;
    }
    if (typeParam === 'memoranda') return 'Filter: Memoranda';
    if (typeParam === 'policies') return 'Filter: Policies';
    if (typeParam === 'advisories') return 'Filter: Advisories';
    return 'Browse by school year folder, then refine with search and filters.';
  }, [searchFromUrl, typeParam]);


  return (
    <div className="issuances-route">
      <div className="dashboard-container">
        <main className="main-content">
          <header className="main-header">
            <div className="header-left">
              <h1 className="header-title">Issuances</h1>
            </div>
          </header>

          <div className="dashboard-body">
            <div className="welcome-banner welcome-banner--split">
              <div className="welcome-banner__text">
                <h2>Issuances &amp; official documents</h2>
                <p>
                  Division memoranda, policies, and advisories for SDO Cabuyao City SHS stakeholders.
                  Select a school-year folder, search by keyword, and use the filters to narrow results.
                </p>
                <p className="welcome-banner__hint">{contextHint}</p>
              </div>
              <div className="welcome-banner__stats" aria-label="Current list summary">
                <div className="stat-pill">
                  <span className="stat-pill__value" style={{ fontSize: '2rem' }}>{displayFiles.length}</span>
                  <span className="stat-pill__label">Showing</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill__value" style={{ fontSize: '2rem' }}>{files.length}</span>
                  <span className="stat-pill__label">In source list</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill__value" style={{ fontSize: '2rem' }}>
                    {folders.find((f) => f.id === activeFolder)?.label || '2023'}
                  </span>
                  <span className="stat-pill__label">Active folder</span>
                </div>
              </div>
            </div>

            <section className="issuances-intro" aria-labelledby="issuances-intro-title">
              <h3 id="issuances-intro-title" className="issuances-intro__title">
                How to use this page
              </h3>
              <ul className="issuances-intro__list">
                <li>
                  <strong>Folders</strong> — pick a school year to load documents for that period (mock data for demo).
                </li>
                <li>
                  <strong>Search</strong> — matches file names; clear the box and refresh to reload the active folder.
                </li>
                <li>
                  <strong>Filters</strong> — year, grade, strand, and document type work with search (demo behavior).
                </li>
                <li>
                  <strong>Chips</strong> (All / PDFs / Policies / Memos) refine the table without leaving the page.
                </li>
              </ul>
            </section>

            <div className="explorer-section">
              <h5 className="section-title">📁 Issuances & Documents</h5>

              <div className="filter-buttons mb-4">
                <button
                  type="button"
                  className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                  style={{ flex: '1', borderRadius: '8px 0 0 8px' }}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`filter-btn ${activeFilter === 'pdfs' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('pdfs')}
                  style={{ flex: '1', borderRadius: '0' }}
                >
                  PDFs
                </button>
                <button
                  type="button"
                  className={`filter-btn ${activeFilter === 'policies' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('policies')}
                  style={{ flex: '1', borderRadius: '0' }}
                >
                  Policies
                </button>
                <button
                  type="button"
                  className={`filter-btn ${activeFilter === 'memos' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('memos')}
                  style={{ flex: '1', borderRadius: '0 8px 8px 0' }}
                >
                  Memos
                </button>
              </div>

              <div className="explorer-grid">
                <div className="folder-list">
                  <div className="folder-list-header p-3 fw-bold border-bottom">
                    Browse Folders
                  </div>
                  <div className="folder-items">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        className={`folder-item ${folder.id === activeFolder ? 'active' : ''}`}
                        onClick={() => setActiveFolder(folder.id)}
                        style={{ paddingLeft: `${(folder.level || 0) * 1.25 + 1}rem` }}
                      >
                        {folder.level > 0 ? '↳ ' : ''}
                        {folder.type === 'year' ? '📅' : '📁'} {folder.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="document-list">
                  <div className="document-toolbar">
                    <div className="toolbar-left">
                      <span className="breadcrumb fw-bold">
                        📂 {folders.find((f) => f.id === activeFolder)?.label || '2023'}
                      </span>
                    </div>
                    <div className="toolbar-center">
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search documents..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                        />
                        <span className="search-icon">🔍</span>
                      </div>
                    </div>
                    <div className="toolbar-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setSearchQuery('');
                          setActiveFolder(folders[0]?.id);
                        }}
                      >
                        🔄
                      </button>
                    </div>
                  </div>

                  <div className="filter-bar">
                    <div className="filter-group">
                      <label className="filter-label">Document Type</label>
                      <select 
                        className="filter-select"
                        value={filterValues.category_id}
                        onChange={(e) => handleFilterChange('category_id', e.target.value)}
                      >
                        <option value="">Select Type (Optional)</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">From Date</label>
                      <input 
                        type="date"
                        className="filter-input"
                        value={filterValues.dateStart}
                        onChange={(e) => handleFilterChange('dateStart', e.target.value)}
                      />
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">To Date</label>
                      <input 
                        type="date"
                        className="filter-input"
                        value={filterValues.dateEnd}
                        onChange={(e) => handleFilterChange('dateEnd', e.target.value)}
                      />
                    </div>

                    <div className="filter-group">
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setFilterValues({
                            schoolYear: '',
                            category_id: '',
                            dateStart: '',
                            dateEnd: '',
                          });
                          setFiles([]);
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>

                  <div className="document-table-wrap">
                    {error && (
                      <div className="alert alert-danger m-3">
                        {error}
                        <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => setError(null)}>Dismiss</button>
                      </div>
                    )}
                    {loading ? (
                      <div className="loading-spinner">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : displayFiles.length > 0 ? (
                      <table className="document-table">
                        <thead>
                          <tr>
                            <th>Document Name</th>
                            <th>Size</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayFiles.map((file) => (
                            <tr key={file.id}>
                              <td>
                                <span className="doc-icon">📄</span>
                                <span className="doc-name">{file.name}</span>
                              </td>
                              <td className="doc-size">
                                {file.size || '1.2MB'}
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                                    onClick={() => {
                                      if (file.file_path) {
                                        window.open(file.file_path, '_blank');
                                      } else {
                                        alert('File attachment not found.');
                                      }
                                    }}
                                  >
                                    <span style={{ fontSize: '10px' }}>👁️</span> View
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    style={{ width: '32px', padding: '0' }}
                                    onClick={() => {
                                      if (file.file_path) {
                                        const link = document.createElement('a');
                                        link.href = file.file_path;
                                        link.download = file.name;
                                        link.target = '_blank';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      } else {
                                        alert('File attachment not found.');
                                      }
                                    }}
                                  >
                                    ⬇️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-files">No files found</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bottom-dashboard">
              <div className="news-section">
                <div className="news-header">
                  <h5>📰 Recent highlights</h5>
                </div>
                <div className="news-feed">
                  {recentHighlights.map((item, i) => (
                    <div key={i} className="news-item">
                      <div className="news-badge">{item.badge}</div>
                      <div className="news-content">
                        <h6>{item.title}</h6>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="calendar-section">
                <div className="calendar-header">
                  <h5>📅 Reporting &amp; deadlines</h5>
                </div>
                <div className="calendar-body">
                  <p className="calendar-body__text">
                    Official cutoff dates are published through division memoranda. Check the table above
                    for the latest issuances and download copies for your records.
                  </p>
                  <ul className="calendar-body__list">
                    <li>Quarterly reports — follow current DM references in the document list.</li>
                    <li>Enrollment-related advisories — watch for advisory filenames in search results.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
