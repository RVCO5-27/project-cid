import React from 'react';
import './Footer.css';

/**
 * Footer - Unified footer component for all pages
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <p>© {currentYear} DepEd SDO Cabuyao City. All rights reserved.</p>
    </footer>
  );
}
