import React from 'react';

export default function FolderButtons({ folders, active, onClick }) {
  return (
    <div className="mb-3 d-flex flex-wrap gap-2">
      {folders.map(f => (
        <button
          key={f.id}
          className={`btn ${active === f.id ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onClick(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
