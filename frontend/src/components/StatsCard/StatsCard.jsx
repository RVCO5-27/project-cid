import React from 'react';
import './StatsCard.css';

/**
 * Sample StatsCard data
 */
const statsCardsData = [
  {
    id: 1,
    label: 'Total Students',
    value: '2,450',
    change: '+12%',
    trend: 'positive'
  },
  {
    id: 2,
    label: 'Active Teachers',
    value: '156',
    change: '+5%',
    trend: 'positive'
  },
  {
    id: 3,
    label: 'Documents',
    value: '1,234',
    change: '+8%',
    trend: 'positive'
  },
  {
    id: 4,
    label: 'Pending Requests',
    value: '23',
    change: '-15%',
    trend: 'negative'
  }
];

/**
 * StatsCard - Display statistics with optional change indicators
 * 
 * @param {string} label - Label for the statistic
 * @param {string|number} value - The statistic value
 * @param {string} change - Optional change indicator (e.g., "+12%", "-5%")
 * @param {string} className - Additional CSS classes
 * @param {string} icon - Optional icon to display
 * @param {string} variant - Card variant: default, primary, success, warning, danger
 */
const StatsCard = ({
  label,
  value,
  change,
  className = '',
  icon,
  variant = 'default'
}) => {
  // Determine if change is positive or negative
  const isPositive = change && change.startsWith('+');
  const changeClass = isPositive ? 'positive' : (change && change.startsWith('-') ? 'negative' : '');

  return (
    <div 
      className={`stats-card ${className} ${variant !== 'default' ? `stats-card--${variant}` : ''}`}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      {/* Icon */}
      {icon && (
        <div className="stats-card__icon" aria-hidden="true">
          {icon}
        </div>
      )}

      {/* Label */}
      <div className="stats-card__label">
        {label}
      </div>

      {/* Value */}
      <div className="stats-card__value">
        {value}
      </div>

      {/* Change Indicator */}
      {change !== undefined && (
        <div 
          className={`stats-card__change ${changeClass}`}
          aria-label={`Change: ${change}`}
        >
          {isPositive ? '↑' : (changeClass === 'negative' ? '↓' : '')} {change}
        </div>
      )}
    </div>
  );
};

/**
 * StatsCards - Container component for multiple stats cards with sample data
 * 
 * @param {Array} cards - Array of card data objects
 * @param {string} className - Additional CSS classes
 */
const StatsCards = ({
  cards = statsCardsData,
  className = ''
}) => {
  return (
    <div className={`stats-cards ${className}`}>
      {cards.map((card) => (
        <StatsCard
          key={card.id}
          label={card.label}
          value={card.value}
          change={card.change}
          icon={card.icon}
          variant={card.variant}
        />
      ))}
    </div>
  );
};

export default StatsCards;
export { StatsCard };
