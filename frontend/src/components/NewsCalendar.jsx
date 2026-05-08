import React, { useState } from 'react';
import { news, calendarEvents } from '../services/mockData';

// Calendar sub-component
function Calendar({ events }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  
  const eventsMap = new Map(events.map(e => [e.date, e.title]));
  
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getEventTypeColor = (type) => {
    const colors = {
      event: 'var(--sdo-primary)',
      academic: 'var(--sdo-success)',
      sports: 'var(--sdo-warning)',
      admin: 'var(--sdo-info)'
    };
    return colors[type] || colors.event;
  };

  return (
    <div className="calendar-widget">
      <table className="table table-sm table-borderless">
        <thead>
          <tr>
            <th colSpan="7" className="text-center fw-bold py-2" style={{ color: 'var(--sdo-primary)' }}>
              {now.toLocaleString('default', { month: 'long' })} {year}
            </th>
          </tr>
          <tr>
            {weekDays.map(day => (
              <th key={day} className="text-center text-muted small" style={{ fontWeight: '500' }}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, r) => (
            <tr key={r}>
              {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                const dateKey = d ? d.toISOString().slice(0, 10) : null;
                const hasEvent = dateKey && eventsMap.has(dateKey);
                const eventDate = hasEvent ? events.find(e => e.date === dateKey) : null;
                
                return (
                  <td 
                    key={i} 
                    className="text-center p-1"
                    style={{ verticalAlign: 'middle' }}
                  >
                    {d ? (
                      <div 
                        className={`calendar-day ${hasEvent ? 'has-event' : ''}`}
                        style={hasEvent ? { backgroundColor: getEventTypeColor(eventDate?.type) } : {}}
                        title={hasEvent ? eventsMap.get(dateKey) : ''}
                      >
                        <span style={{ fontSize: '0.85rem' }}>{d.getDate()}</span>
                      </div>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Event Legend */}
      <div className="mt-3 px-2">
        <small className="text-muted d-block mb-2">Event Types:</small>
        <div className="d-flex flex-wrap gap-2">
          <span className="badge" style={{ backgroundColor: 'var(--sdo-primary)' }}>Event</span>
          <span className="badge" style={{ backgroundColor: 'var(--sdo-success)' }}>Academic</span>
          <span className="badge" style={{ backgroundColor: 'var(--sdo-warning)', color: '#333' }}>Sports</span>
          <span className="badge" style={{ backgroundColor: 'var(--sdo-info)' }}>Admin</span>
        </div>
      </div>
    </div>
  );
}

/**
 * NewsCalendar - News feed and calendar section
 * Displays mock SDO Facebook feed and calendar events
 */
export function NewsCalendar() {
  const [activeTab, setActiveTab] = useState('news');
  
  return (
    <div className="row g-4">
      {/* News Section - 8 columns */}
      <div className="col-12 col-lg-8">
        <div className="card h-100" style={{ borderRadius: '16px' }}>
          {/* Tab Navigation */}
          <div className="card-header bg-white border-0 py-3" style={{ borderRadius: '16px 16px 0 0' }}>
            <ul className="nav nav-pills" role="tablist">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'news' ? 'active' : ''}`}
                  onClick={() => setActiveTab('news')}
                  style={{ borderRadius: '8px' }}
                >
                  📰 Latest News
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'announcements' ? 'active' : ''}`}
                  onClick={() => setActiveTab('announcements')}
                  style={{ borderRadius: '8px' }}
                >
                  📢 Announcements
                </button>
              </li>
            </ul>
          </div>
          
          {/* Tab Content */}
          <div className="card-body p-0">
            {activeTab === 'news' ? (
              <div className="list-group list-group-flush">
                {news.map(n => (
                  <div 
                    key={n.id} 
                    className="news-item list-group-item border-0 py-3 px-4"
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        {/* Category Badge */}
                        <span 
                          className="news-category badge me-2 mb-2"
                          style={{ 
                            backgroundColor: 'var(--sdo-primary-light)',
                            color: 'white'
                          }}
                        >
                          {n.category}
                        </span>
                        
                        {/* Title */}
                        <h6 className="mb-1 fw-bold">{n.title}</h6>
                        
                        {/* Excerpt */}
                        <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                          {n.excerpt}
                        </p>
                        
                        {/* Meta */}
                        <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.8rem' }}>
                          <span className="text-muted">
                            📅 {new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-muted">
                            👤 {n.author}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action */}
                      <button 
                        className="btn btn-sm btn-outline-secondary ms-3 flex-shrink-0"
                        style={{ borderRadius: '8px' }}
                      >
                        Read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <div className="alert alert-info mb-0" style={{ borderRadius: '12px' }}>
                  <strong>📢 No announcements</strong> at this time. Check back later for updates.
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="card-footer bg-white border-0 py-3" style={{ borderRadius: '0 0 16px 16px' }}>
            <a href="#all-news" className="text-decoration-none fw-bold" style={{ color: 'var(--sdo-primary)' }}>
              View all news →
            </a>
          </div>
        </div>
      </div>
      
      {/* Calendar Section - 4 columns */}
      <div className="col-12 col-lg-4">
        <div className="card h-100" style={{ borderRadius: '16px' }}>
          <div className="card-header bg-white border-0 py-3" style={{ borderRadius: '16px 16px 0 0' }}>
            <h6 className="mb-0 fw-bold d-flex align-items-center">
              <span className="me-2">📅</span>
              Calendar
            </h6>
          </div>
          <div className="card-body p-3">
            <Calendar events={calendarEvents} />
          </div>
          <div className="card-footer bg-white border-0 py-3" style={{ borderRadius: '0 0 16px 16px' }}>
            <a href="#full-calendar" className="text-decoration-none fw-bold" style={{ color: 'var(--sdo-primary)' }}>
              Full calendar →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsCalendar;
