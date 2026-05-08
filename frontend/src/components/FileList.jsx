import React from 'react';

function FileRow({ file }) {
  return (
    <tr className="align-middle file-row">
      <td>
        <i className="bi bi-file-earmark-pdf-fill text-danger me-2" aria-hidden="true"></i>
        {file.name}
      </td>
      <td>{file.size}</td>
      <td>
        <button className="btn btn-sm btn-outline-secondary me-2">View</button>
        <button className="btn btn-sm btn-outline-primary">Download</button>
      </td>
    </tr>
  );
}

export default function FileList({ files }) {
  if (!files || files.length === 0) return <div className="p-4 text-muted">No documents in this folder.</div>;

  return (
    <div className="table-responsive doc-list">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>File Name</th>
            <th style={{width: '120px'}}>Size</th>
            <th style={{width: '200px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map(f => <FileRow key={f.id} file={f} />)}
        </tbody>
      </table>
    </div>
  );
}
