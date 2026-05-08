import React from 'react';
import './IssuanceTabs.css';

export default function IssuanceTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'memoranda', label: 'Memoranda', count: 4 },
    { id: 'policies', label: 'Policies', count: 2 },
  ];

  return (
    <div className="issuance-tabs" role="tablist" aria-label="Document types">
      <nav className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.label}
            <span className="tab-count" aria-label={`${tab.count} items`}>{tab.count}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

