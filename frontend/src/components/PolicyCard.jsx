import React from 'react';
import './PolicyCard/PolicyCard.css';

export default function PolicyCard({ policies, onDownload, onView, isAdmin = false }) {
  if (!policies || policies.length === 0) {
    return (
      <div className="policy-empty" role="status" aria-live="polite">
        <p>No policies found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div 
      className="policy-grid" 
      role="list" 
      aria-label="Policy documents"
    >
      {policies.map((policy) => (
        <article 
          key={policy.id} 
          className="policy-card content-card"
          role="listitem"
          aria-labelledby={`policy-title-${policy.id}`}
        >
          <header className="policy-header">
            <h4 id={`policy-title-${policy.id}`} className="policy-title">{policy.title}</h4>
            <span className="badge bg-primary" aria-label={`Category: ${policy.sub_category}`}>
              {policy.sub_category}
            </span>
          </header>
          <p className="policy-description">{policy.description}</p>
          <div className="policy-meta" aria-label="Document metadata">
            <span>Ref: {policy.ref_no}</span>
            <span>Date: {new Date(policy.date_issued).toLocaleDateString()}</span>
          </div>
          <div className="policy-actions" role="group" aria-label="Document actions">
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => onDownload(policy)}
              aria-label={`Download ${policy.title}`}
            >
              Download PDF
            </button>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => onView(policy)}
              aria-label={`Preview ${policy.title}`}
            >
              Preview
            </button>
            {isAdmin && (
              <button 
                className="btn btn-danger btn-sm"
                aria-label={`Delete ${policy.title}`}
              >
                Delete
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

