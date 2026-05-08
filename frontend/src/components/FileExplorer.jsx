import React, { useState, useEffect } from 'react';
import { fetchFolders, fetchFilesForFolder } from '../services/mockDocs';

/**
 * FileExplorer - Document/Issuance browser with folders by year
 * Allows viewing and downloading of files
 */
export function FileExplorer() {
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Load folders on mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const data = await fetchFolders();
        setFolders(data);
        if (data && data.length > 0) {
          setActiveFolder(data[0].id);
        }
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    loadFolders();
  }, []);
  
  // Load files when active folder changes
  useEffect(() => {
    if (!activeFolder) return;
    
    let mounted = true;
    
    const loadFiles = async () => {
      setLoading(true);
      try {
        const docs = await fetchFilesForFolder(activeFolder);
        if (mounted) setFiles(docs);
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadFiles();
    
    return () => { mounted = false; };
  }, [activeFolder]);
  
  const handleView = (file) => {
    alert(`Viewing: ${file.name}\nSize: ${file.size}`);
    // TODO: Integrate with actual PDF viewer or document viewer
  };
  
  const handleDownload = (file) => {
    alert(`Downloading: ${file.name}`);
    // TODO: Implement actual file download
  };

  return (
    <div className="card mb-4" style={{ borderRadius: '16px' }}>
      <div className="card-header bg-white py-3" style={{ borderRadius: '16px 16px 0 0' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <h5 className="mb-0 fw-bold d-flex align-items-center">
            <span className="me-2">📁</span>
            Issuances & Documents
          </h5>
          
          {/* Filter Buttons */}
          <div className="btn-group" role="group" aria-label="File filters">
            <button className="btn btn-sm btn-outline-secondary active">All</button>
            <button className="btn btn-sm btn-outline-secondary">PDFs</button>
            <button className="btn btn-sm btn-outline-secondary">Policies</button>
            <button className="btn btn-sm btn-outline-secondary">Memos</button>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        {/* Folder/Year Buttons */}
        <div className="mb-4">
          <h6 className="text-muted mb-3">
            <small>SELECT YEAR</small>
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {folders.map(folder => (
              <button
                key={folder.id}
                className={`folder-btn btn ${folder.id === activeFolder ? 'active' : 'btn-outline-primary'}`}
                onClick={() => setActiveFolder(folder.id)}
                style={{ 
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                📂 {folder.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* File List */}
        <div>
          <h6 className="text-muted mb-3">
            <small>
              FILES IN {folders.find(f => f.id === activeFolder)?.label || 'SELECTED YEAR'}
            </small>
          </h6>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading files...</p>
            </div>
          ) : files.length > 0 ? (
            <div className="row g-3">
              {files.map(file => (
                <div className="col-12" key={file.id}>
                  <div 
                    className="file-item d-flex justify-content-between align-items-center p-3 bg-white"
                    style={{ borderRadius: '12px' }}
                  >
                    <div className="d-flex align-items-center">
                      <span className="file-icon me-3">📄</span>
                      <div>
                        <div className="file-name">{file.name}</div>
                        <div className="file-meta">
                          {file.size} • {file.date}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleView(file)}
                        style={{ borderRadius: '8px' }}
                      >
                        👁️ View
                      </button>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleDownload(file)}
                        style={{ borderRadius: '8px' }}
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info mb-0" style={{ borderRadius: '12px' }}>
              No files found for this year.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileExplorer;
