import { useState, useEffect } from 'react';

export default function UserForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    if (initial.id) {
      setForm({
        username: initial.username || '',
        email: initial.email || '',
        password: '', // Don't populate password
        role: initial.role || 'user'
      });
    }
  }, [initial]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-3">
      <div className="row g-2">
        <div className="col-md-4">
          <label className="form-label">Username</label>
          <input 
            name="username" 
            value={form.username} 
            onChange={handleChange} 
            className="form-control" 
            required 
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Email</label>
          <input 
            name="email" 
            type="email"
            value={form.email} 
            onChange={handleChange} 
            className="form-control" 
            required 
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Role</label>
          <select name="role" value={form.role} onChange={handleChange} className="form-select">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="row g-2 mt-2">
        <div className="col-md-6">
          <label className="form-label">
            {initial.id ? 'New Password (leave blank to keep current)' : 'Password'}
          </label>
          <input 
            name="password" 
            type="password"
            value={form.password} 
            onChange={handleChange} 
            className="form-control" 
            required={!initial.id}
          />
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
