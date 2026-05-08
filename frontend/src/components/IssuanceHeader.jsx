import React from 'react';
import './IssuanceHeader.css';

export default function IssuanceHeader({ title, subtitle = 'Official SHS Implementation References' }) {
  return (
    <header className="issuance-header">
      <h1 className="hero-title">{title}</h1>
      {subtitle && <p className="hero-copy">{subtitle}</p>}
    </header>
  );
}

