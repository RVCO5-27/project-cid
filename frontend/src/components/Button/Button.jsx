import React from 'react';
import './Button.css';

/**
 * Button - Reusable button component with multiple variants and sizes
 * 
 * @param {string} children - Button text content
 * @param {string} variant - Button variant: primary, secondary, danger, outline
 * @param {string} size - Button size: sm, md, lg
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional class names
 * @param {string} type - Button type attribute
 * @param {boolean} block - Full width button
 * @param {object} props - Additional props
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false, 
  className = '', 
  type = 'button',
  block = false,
  ...props 
}) => {
  const baseClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    block ? 'btn--block' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled ? 'true' : undefined}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
