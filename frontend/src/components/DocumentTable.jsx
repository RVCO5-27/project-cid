import React from 'react';
import './DocumentTable/DocumentTable.css';

export default function DocumentTable({ documents, onDownload, isAdmin = false }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="document-empty" role="status" aria-live="polite">
        <p>No memoranda found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div 
      className="document-table-wrap content-card" 
      role="region" 
      aria-label="Documents table"
    >
      <table className="document-table" role="table">
        <thead>
          <tr role="row">
            <th scope="col" role="columnheader">Title</th>
            <th scope="col" role="columnheader">Reference</th>
            <th scope="col" role="columnheader">Date</th>
            <th scope="col" role="columnheader">Type</th>
            <th scope="col" role="columnheader">Actions</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {documents.map((doc) => (
            <tr key={doc.id} role="row">
              <td role="cell">
                <strong className="document-title">{doc.title}</strong>
                <p className="document-description">{doc.description}</p>
              </td>
              <td role="cell">{doc.ref_no}</td>
              <td role="cell">{new Date(doc.date_issued).toLocaleDateString()}</td>
              <td role="cell">
                <span className="badge bg-primary">{doc.sub_category}</span>
              </td>
              <td role="cell">
                <div className="document-actions" role="group" aria-label="Document actions">
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={() => onDownload(doc)}
                    aria-label={`Download ${doc.title}`}
                  >
                    Download
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => window.open(doc.file_url)}
                    aria-label={`View ${doc.title}`}
                  >
                    View
                  </button>
                  {isAdmin && (
                    <button 
                      className="btn btn-sm btn-danger"
                      aria-label={`Delete ${doc.title}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

