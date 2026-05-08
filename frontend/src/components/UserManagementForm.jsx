import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function UserManagementForm({ initial = {}, onCancel, onSave }) {
  const { user: currentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Admin',
    status: 'active'
  });

  useEffect(() => {
    if (initial.id) {
      setForm({
        username: initial.username || '',
        email: initial.email || '',
        password: '', // Don't populate password
        role: initial.role || 'Admin',
        status: initial.status || 'active'
      });
    }
  }, [initial]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0 fw-bold">{initial.id ? '✏️ Edit User' : '👤 Add New User'}</h5>
      </div>
      <form onSubmit={handleSubmit} className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold small text-uppercase">Username</label>
            <input 
              name="username" 
              value={form.username} 
              onChange={handleChange} 
              className="form-control form-control-lg" 
              placeholder="Enter username"
              required 
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small text-uppercase">Email Address</label>
            <input 
              name="email" 
              type="email"
              value={form.email} 
              onChange={handleChange} 
              className="form-control form-control-lg" 
              placeholder="email@example.com"
              required 
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small text-uppercase">Role</label>
            <select 
              name="role" 
              value={form.role} 
              onChange={handleChange} 
              className="form-select form-select-lg"
              disabled={true}
            >
              <option value="Admin">Admin</option>
              {initial.role === 'SuperAdmin' && <option value="SuperAdmin">SuperAdmin</option>}
            </select>
            <div className="form-text text-muted">
              {initial.role === 'SuperAdmin' ? 'SuperAdmin account role cannot be changed.' : 'New users are created as Admins.'}
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small text-uppercase">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="form-select form-select-lg">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label fw-bold small text-uppercase">
              {initial.id ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <div className="input-group">
              <input 
                name="password" 
                type={showPassword ? 'text' : 'password'}
                value={form.password} 
                onChange={handleChange} 
                className="form-control form-control-lg" 
                placeholder={initial.id ? "••••••••" : "Enter password"}
                required={!initial.id}
              />
              <button 
                className="btn btn-outline-secondary px-3" 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ border: '1px solid #ced4da' }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 d-flex gap-2">
          <button type="submit" className="btn btn-primary px-4 fw-bold">Save User</button>
          <button type="button" className="btn btn-light border px-4" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
