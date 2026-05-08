import { useState, useEffect } from 'react';

export default function OrganizationalChartForm({ initial = {}, onSave, onUpload }) {
  const [form, setForm] = useState({
    title: '',
    image_path: '',
    caption: '',
  });

  useEffect(() => {
    if (initial.id) {
      setForm(initial);
    }
  }, [initial]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const filePath = await onUpload(file);
      setForm({ ...form, image_path: filePath });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-3">
      <div className="mb-2">
        <label className="form-label">Title</label>
        <input name="title" value={form.title} onChange={handleChange} className="form-control" required />
      </div>
      <div className="mb-2">
        <label className="form-label">Caption</label>
        <textarea name="caption" value={form.caption} onChange={handleChange} className="form-control" />
      </div>
      <div>
        <label className="form-label">Image</label>
        <input type="file" onChange={handleFileChange} className="form-control" />
        {form.image_path && <img src={form.image_path} alt="Preview" className="img-thumbnail mt-2" style={{ maxHeight: '200px' }} />}
      </div>
      <div className="mt-3">
        <button type="submit" className="btn btn-primary">Save</button>
      </div>
    </form>
  );
}
