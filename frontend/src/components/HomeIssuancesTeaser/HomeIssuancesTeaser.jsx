import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { searchDocuments } from '../../services/issuancesDocumentService';
import './HomeIssuancesTeaser.css';

const QUICK_LINKS = [
  { label: 'Memoranda', to: '/issuances?category=1', icon: '📜' },
  { label: 'Policies', to: '/issuances?category=2', icon: '📋' },
  { label: 'Advisories', to: '/issuances?category=3', icon: '⚠️' },
];

/**
 * Home-only teaser — full explorer lives at /issuances (no duplicated carousel or dashboard).
 */
export default function HomeIssuancesTeaser() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentDocuments = async () => {
      try {
        setLoading(true);
        // Fetch recent documents - API returns them in order
        const docs = await searchDocuments({});
        // Get the 5 most recent
        setDocuments(docs.slice(0, 5));
      } catch (err) {
        console.error('Failed to load recent issuances:', err);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentDocuments();
  }, []);

  return (
    <div className="home-issuances-teaser">
      <p className="home-issuances-teaser__lead">
        Browse official division memoranda, policies, and advisories. Use filters and folders on the
        dedicated Issuances page.
      </p>

      <div className="home-issuances-teaser__row">
        <div className="home-issuances-teaser__quick">
          <h3 className="home-issuances-teaser__subhead">Jump to</h3>
          <ul className="home-issuances-teaser__pills" role="list">
            {QUICK_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="home-issuances-teaser__pill">
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="home-issuances-teaser__cta">
          <Link to="/issuances" className="home-issuances-teaser__btn-primary">
            Open Issuances &amp; Documents
          </Link>
          <p className="home-issuances-teaser__hint">
            Search, filter by year, and manage files in the full workspace.
          </p>
        </div>
      </div>

      {!loading && documents.length > 0 && (
        <div className="home-issuances-teaser__uploads">
          <h3 className="home-issuances-teaser__subhead">Recent Issuances</h3>
          <ul className="home-issuances-teaser__file-list" role="list">
            {documents.map((doc, idx) => (
              <li key={`${doc.id ?? 'doc'}-${doc.file_path || doc.name || 'item'}-${idx}`}>
                <div className="home-issuances-teaser__file-item">
                  <span aria-hidden="true" className="home-issuances-teaser__file-icon">📄</span>
                  <div className="home-issuances-teaser__file-info">
                    <div className="home-issuances-teaser__file-name">{doc.name}</div>
                    {doc.doc_number && (
                      <div className="home-issuances-teaser__file-meta">
                        {doc.doc_number} • {doc.category}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {documents.length === 5 && (
            <p className="home-issuances-teaser__more">View all on Issuances page</p>
          )}
        </div>
      )}
    </div>
  );
}
