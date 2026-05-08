import React from 'react';
import { coreSections } from '../services/mockData';

/**
 * CoreCards - Section navigation cards for portal pages
 * Displays About, Organizational Structure, Policy, Issuances, Services, Inventory, Research & Innovation
 */
export function CoreCards() {
  return (
    <div className="row g-4">
      {coreSections.map((section, index) => (
        <div 
          className={`col-12 col-sm-6 col-lg-4 animate-fade-in-up animate-delay-${index + 1}`} 
          key={section.key}
        >
          <a 
            href={section.link} 
            className="text-decoration-none"
          >
            <div 
              className="card h-100 core-card"
              style={{ 
                borderTop: `4px solid ${section.color}`,
                opacity: 0,
                animation: `fadeInUp 0.5s ease forwards`,
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="card-body text-center">
                <span 
                  className="core-card-icon"
                  role="img" 
                  aria-hidden="true"
                >
                  {section.icon}
                </span>
                <h5 className="core-card-title">{section.title}</h5>
                <p className="core-card-desc">{section.desc}</p>
                <span 
                  className="btn btn-sm mt-2" 
                  style={{ 
                    backgroundColor: section.color, 
                    color: 'white' 
                  }}
                >
                  Explore →
                </span>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}

export default CoreCards;
