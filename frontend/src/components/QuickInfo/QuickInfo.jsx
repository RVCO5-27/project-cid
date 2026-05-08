import React from 'react';
import './QuickInfo.css';

/**
 * Sample QuickInfo data
 */
const quickInfoItems = [
  {
    id: 1,
    icon: '🎓',
    title: 'Enrollment',
    detail: 'View enrollment guidelines and procedures for incoming Grade 11 and 12 students.',
    stats: 'Open',
    link: '/enrollment'
  },
  {
    id: 2,
    icon: '📊',
    title: 'Academic Results',
    detail: 'Access your assessment grades, progress reports, and transcript of records.',
    stats: 'View Grades',
    link: '/results'
  },
  {
    id: 3,
    icon: '💼',
    title: 'Career Guidance',
    detail: 'Explore career opportunities, job placements, and industry partnerships.',
    stats: 'Explore',
    link: '/careers'
  },
  {
    id: 4,
    icon: '📚',
    title: 'Learning Resources',
    detail: 'Access digital libraries, learning materials, and educational content.',
    stats: 'Browse',
    link: '/resources'
  }
];

/**
 * QuickInfo - Quick info and action cards section
 * 
 * @param {Array} items - Array of info items (optional, uses default if not provided)
 * @param {function} onItemClick - Callback when item is clicked
 */
const QuickInfo = ({
  items = quickInfoItems,
  onItemClick
}) => {
  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleLearnMore = (e, link) => {
    e.preventDefault();
    // In a real app, this would navigate using react-router
    console.log('Navigate to:', link);
  };

  return (
    <div className="quick-info">
      <div className="quick-info__grid">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="quick-info__card"
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            {/* Icon */}
            <div 
              className="quick-info__icon"
              role="img"
              aria-hidden="true"
            >
              {item.icon}
            </div>

            {/* Stats Badge */}
            {item.stats && (
              <span className="quick-info__badge">
                {item.stats}
              </span>
            )}

            {/* Title */}
            <h6 className="quick-info__title">
              {item.title}
            </h6>

            {/* Detail */}
            <p className="quick-info__detail">
              {item.detail}
            </p>

            {/* Link */}
            <a 
              href={item.link}
              className="quick-info__link"
              onClick={(e) => handleLearnMore(e, item.link)}
            >
              Learn More
              <span className="quick-info__link-icon" aria-hidden="true">→</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickInfo;
