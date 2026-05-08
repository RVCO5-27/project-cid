import { useState, useEffect } from 'react';
import { resolveFileUrl } from '../services/api';

export default function CarouselForm({ initial = {}, onCancel, onSave, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    image_path: initial.image_path || '',
    cta_text: initial.cta_text || '',
    cta_link: initial.cta_link || '',
    category: initial.category || '',
    sort_order: initial.sort_order || 0,
  });

  // Re-sync form if initial changes, but usually key handles this
  useEffect(() => {
    setForm({
      title: initial.title || '',
      description: initial.description || '',
      image_path: initial.image_path || '',
      cta_text: initial.cta_text || '',
      cta_link: initial.cta_link || '',
      category: initial.category || '',
      sort_order: initial.sort_order || 0,
    });
  }, [initial]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        const filePath = await onUpload(file);
        if (filePath) {
          setForm(prev => ({ ...prev, image_path: filePath }));
        }
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.image_path) {
      alert('Please upload an image for the carousel slide.');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-3">
      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="form-control" required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Category</label>
          <input name="category" value={form.category} onChange={handleChange} className="form-control" />
        </div>
      </div>
      <div className="mt-2">
        <label className="form-label">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="form-control" />
      </div>
      <div className="row g-2 mt-2">
        <div className="col-md-6">
          <label className="form-label">CTA Text</label>
          <input name="cta_text" value={form.cta_text} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-md-6">
          <label className="form-label">CTA Link</label>
          <input name="cta_link" value={form.cta_link} onChange={handleChange} className="form-control" />
        </div>
      </div>
      <div className="row g-2 mt-2">
        <div className="col-md-6">
          <label className="form-label">Image</label>
          <input type="file" onChange={handleFileChange} className="form-control" disabled={uploading} />
          {uploading && <div className="text-muted mt-1">Uploading...</div>}
          {!uploading && form.image_path && <img src={resolveFileUrl(form.image_path)} alt="Preview" className="img-thumbnail mt-2" style={{ maxHeight: '150px' }} />}
        </div>
        <div className="col-md-6">
          <label className="form-label">Sort Order</label>
          <input name="sort_order" type="number" value={form.sort_order} onChange={handleChange} className="form-control" />
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
