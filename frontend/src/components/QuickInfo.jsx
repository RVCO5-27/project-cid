import React from 'react';
import { quickInfo } from '../services/mockData';

/**
 * QuickInfo - Quick info and jobs section with cards
 * Displays hiring info, assessment results, job opportunities
 */
export function QuickInfo() {
  return (
    <div className="row g-3">
      {quickInfo.map((item, index) => (
        <div 
          className="col-12 col-md-6 col-lg-3" 
          key={item.id}
        >
          <div 
            className="card h-100 quick-info-card"
            style={{ 
              opacity: 0,
              animation: `fadeInUp 0.5s ease forwards`,
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="card-body">
              {/* Icon */}
              <div 
                className="quick-info-icon mb-3"
                role="img" 
                aria-hidden="true"
              >
                {item.icon}
              </div>
              
              {/* Stats Badge */}
              {item.stats && (
                <span className="quick-info-stats badge mb-2">
                  {item.stats}
                </span>
              )}
              
              {/* Title */}
              <h6 className="card-title fw-bold mb-2">{item.title}</h6>
              
              {/* Detail */}
              <p className="card-text text-muted small mb-3">{item.detail}</p>
              
              {/* Link */}
              <a 
                href={item.link} 
                className="btn btn-sm btn-outline-primary"
              >
                Learn More →
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default QuickInfo;
