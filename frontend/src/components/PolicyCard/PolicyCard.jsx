import React from 'react';
import './PolicyCard.css';

/**
 * Sample PolicyCard data
 */
const samplePolicies = [
  {
    id: 1,
    title: 'DM-2026-015: School-Based Feeding Program',
    description: 'Implementation guidelines for the School-Based Feeding Program for Academic Year 2026-2027.',
    category: 'Memorandum',
    date: 'January 15, 2026',
    reference: 'DM-2026-015'
  },
  {
    id: 2,
    title: 'DO-2026-012: K to 12 Curriculum Updates',
    description: 'Updated curriculum guidelines for Kindergarten to Grade 12 programs effective Academic Year 2026.',
    category: 'Policy',
    date: 'February 1, 2026',
    reference: 'DO-2026-012'
  },
  {
    id: 3,
    title: 'DM-2025-022: Examination Schedule Guidelines',
    description: 'Standard examination scheduling guidelines for all public and private secondary schools.',
    category: 'Memorandum',
    date: 'March 10, 2025',
    reference: 'DM-2025-022'
  }
];

/**
 * PolicyCard - Individual policy/document card component
 * 
 * @param {string} title - Policy title
 * @param {string} description - Policy description
 * @param {string} category - Policy category (Memorandum, Policy, Advisory)
 * @param {string} date - Date of the policy
 * @param {string} reference - Reference number
 * @param {function} onView - Callback when view is clicked
 * @param {function} onDownload - Callback when download is clicked
 * @param {string} className - Additional CSS classes
 */
const PolicyCard = ({
  title,
  description,
  category,
  date,
  reference,
  onView,
  onDownload,
  className = ''
}) => {
  const handleView = (e) => {
    e.preventDefault();
    if (onView) {
      onView({ title, description, category, date, reference });
    } else {
      alert(`Viewing: ${title}\nReference: ${reference}\nDate: ${date}`);
    }
  };

  const handleDownload = (e) => {
    e.preventDefault();
    if (onDownload) {
      onDownload({ title, description, category, date, reference });
    } else {
      alert(`Downloading: ${title}`);
    }
  };

  const getCategoryClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'policy':
        return 'policy';
      case 'memorandum':
        return 'memorandum';
      case 'advisory':
        return 'advisory';
      default:
        return 'policy';
    }
  };

  return (
    <article className={`policy-card ${className}`}>
      <div className="policy-header">
        <h3 className="policy-title">{title}</h3>
        <span className={`badge bg-primary ${getCategoryClass(category)}`}>
          {category}
        </span>
      </div>
      
      <p className="policy-description">{description}</p>
      
      <div className="policy-meta">
        <span className="policy-date">📅 {date}</span>
        <span className="policy-ref">📋 {reference}</span>
      </div>
      
      <div className="policy-actions">
        <button 
          className="btn btn-sm btn-secondary"
          onClick={handleView}
          aria-label={`View ${title}`}
        >
          👁️ View
        </button>
        <button 
          className="btn btn-sm btn-primary"
          onClick={handleDownload}
          aria-label={`Download ${title}`}
        >
          ⬇️ Download
        </button>
      </div>
    </article>
  );
};

/**
 * PolicyCards - Container component for multiple policy cards with sample data
 * 
 * @param {Array} policies - Array of policy data objects
 * @param {function} onView - Callback when view is clicked
 * @param {function} onDownload - Callback when download is clicked
 * @param {string} className - Additional CSS classes
 */
const PolicyCards = ({
  policies = samplePolicies,
  onView,
  onDownload,
  className = ''
}) => {
  if (!policies || policies.length === 0) {
    return (
      <div className="policy-empty">
        <p>No policies found.</p>
      </div>
    );
  }

  return (
    <div className={`policy-grid ${className}`}>
      {policies.map((policy) => (
        <PolicyCard
          key={policy.id}
          title={policy.title}
          description={policy.description}
          category={policy.category}
          date={policy.date}
          reference={policy.reference}
          onView={onView}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};

export default PolicyCards;
export { PolicyCard, samplePolicies };
