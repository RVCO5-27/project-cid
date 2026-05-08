import React, { useState, useEffect } from 'react';
import './FileExplorer.css';

/**
 * Sample folder data
 */
const sampleFolders = [
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' }
];

/**
 * Sample file data by folder
 */
const sampleFiles = {
  '2026': [
    { id: 1, name: 'DM-2026-015_School_Based_Feeding_Program.pdf', size: '2.4 MB', date: 'Jan 15, 2026', type: 'memorandum' },
    { id: 2, name: 'DM-2026-012_Enrollment_Guidelines.pdf', size: '1.8 MB', date: 'Jan 10, 2026', type: 'memorandum' },
    { id: 3, name: 'DO-2026-012_K_to_12_Curriculum.pdf', size: '5.2 MB', date: 'Feb 01, 2026', type: 'policy' },
    { id: 4, name: 'RM-2026-034_Training_Schedule.pdf', size: '890 KB', date: 'Feb 15, 2026', type: 'memorandum' }
  ],
  '2025': [
    { id: 5, name: 'DO-2025-008_Assessment_Policy.pdf', size: '3.1 MB', date: 'Mar 20, 2025', type: 'policy' },
    { id: 6, name: 'DM-2025-022_Exam_Schedule.pdf', size: '1.2 MB', date: 'Mar 10, 2025', type: 'memorandum' }
  ],
  '2024': [
    { id: 7, name: 'DO-2024-015_Grading_Policy.pdf', size: '2.8 MB', date: 'Apr 05, 2024', type: 'policy' },
    { id: 8, name: 'DM-2024-008_Registration_Guidelines.pdf', size: '1.5 MB', date: 'Feb 28, 2024', type: 'memorandum' }
  ],
  '2023': [
    { id: 9, name: 'DO-2023-021_Academic_Freedom.pdf', size: '4.2 MB', date: 'May 15, 2023', type: 'policy' },
    { id: 10, name: 'DM-2023-005_Attendance_Policy.pdf', size: '980 KB', date: 'Jan 25, 2023', type: 'memorandum' }
  ]
};

/**
 * FileExplorer - Document browser with folders and files
 * 
 * @param {Array} folders - Array of folder objects
 * @param {object} initialFolder - Initial active folder
 * @param {function} onFileSelect - Callback when file is selected
 * @param {function} onFileView - Callback when file view is clicked
 * @param {function} onFileDownload - Callback when file download is clicked
 */
const FileExplorer = ({
  folders = sampleFolders,
  initialFolder = null,
  onFileSelect,
  onFileView,
  onFileDownload
}) => {
  const [activeFolder, setActiveFolder] = useState(initialFolder || (folders[0]?.id || null));
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load files when folder changes
  useEffect(() => {
    if (!activeFolder) return;

    setLoading(true);
    
    // Simulate loading files (in real app, this would be an API call)
    const timer = setTimeout(() => {
      const folderFiles = sampleFiles[activeFolder] || [];
      setFiles(folderFiles);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [activeFolder]);

  // Filter files based on active filter and search
  const filteredFiles = files.filter(file => {
    // Apply type filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'policies' && file.type !== 'policy') return false;
      if (activeFilter === 'memos' && file.type !== 'memorandum') return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return file.name.toLowerCase().includes(query);
    }
    
    return true;
  });

  const handleViewFile = (file) => {
    if (onFileView) {
      onFileView(file);
    } else {
      alert(`Viewing: ${file.name}\nSize: ${file.size}\nDate: ${file.date}`);
    }
  };

  const handleDownloadFile = (file) => {
    if (onFileDownload) {
      onFileDownload(file);
    } else {
      alert(`Downloading: ${file.name}`);
    }
  };

  const handleFolderChange = (folderId) => {
    setActiveFolder(folderId);
    setSearchQuery('');
    if (onFileSelect) {
      onFileSelect(folderId);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'policy':
        return '📜';
      case 'memorandum':
        return '📋';
      default:
        return '📄';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'policy':
        return 'Policy';
      case 'memorandum':
        return 'Memo';
      default:
        return 'Document';
    }
  };

  return (
    <div className="file-explorer">
      {/* Header */}
      <div className="file-explorer__header">
        <h5 className="file-explorer__title">
          <span className="file-explorer__icon">📁</span>
          Issuances & Documents
        </h5>
        
        {/* Filter Buttons */}
        <div className="file-explorer__filters" role="group" aria-label="File filters">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'policies' ? 'active' : ''}`}
            onClick={() => setActiveFilter('policies')}
          >
            Policies
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'memos' ? 'active' : ''}`}
            onClick={() => setActiveFilter('memos')}
          >
            Memos
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="file-explorer__body">
        {/* Folder/Year Buttons */}
        <div className="file-explorer__folders">
          <h6 className="file-explorer__section-title">
            <small>SELECT YEAR</small>
          </h6>
          <div className="folder-buttons">
            {folders.map(folder => (
              <button
                key={folder.id}
                className={`folder-btn ${folder.id === activeFolder ? 'active' : ''}`}
                onClick={() => handleFolderChange(folder.id)}
                aria-pressed={folder.id === activeFolder}
              >
                📂 {folder.label}
              </button>
            ))}
          </div>
        </div>

        {/* File List */}
        <div className="file-explorer__files">
          <h6 className="file-explorer__section-title">
            <small>
              FILES IN {folders.find(f => f.id === activeFolder)?.label || 'SELECTED YEAR'}
            </small>
          </h6>

          {/* Search */}
          <div className="file-search">
            <input
              type="text"
              className="file-search__input"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search files"
            />
            <span className="file-search__icon">🔍</span>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="file-explorer__loading">
              <div className="spinner" role="status" aria-label="Loading">
                <span className="spinner__icon"></span>
              </div>
              <p>Loading files...</p>
            </div>
          ) : filteredFiles.length > 0 ? (
            /* File List */
            <div className="file-list">
              {filteredFiles.map(file => (
                <div 
                  key={file.id} 
                  className="file-item"
                >
                  <div className="file-item__icon">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="file-item__info">
                    <div className="file-item__name">{file.name}</div>
                    <div className="file-item__meta">
                      <span className="file-item__size">{file.size}</span>
                      <span className="file-item__separator">•</span>
                      <span className="file-item__date">{file.date}</span>
                      <span className="file-item__separator">•</span>
                      <span className={`file-item__type type-${file.type}`}>
                        {getTypeLabel(file.type)}
                      </span>
                    </div>
                  </div>
                  <div className="file-item__actions">
                    <button 
                      className="file-item__btn file-item__btn--view"
                      onClick={() => handleViewFile(file)}
                      aria-label={`View ${file.name}`}
                    >
                      👁️ View
                    </button>
                    <button 
                      className="file-item__btn file-item__btn--download"
                      onClick={() => handleDownloadFile(file)}
                      aria-label={`Download ${file.name}`}
                    >
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="file-explorer__empty">
              <span className="file-explorer__empty-icon">📂</span>
              <p>No files found for this year.</p>
              {searchQuery && (
                <button 
                  className="file-explorer__clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
