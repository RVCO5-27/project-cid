import { useEffect, useState } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../services/adminManagement';
import UserManagementForm from '../components/UserManagementForm';
import { useAuth } from '../context/AuthContext';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (u) => { setEditing(u); setShowForm(true); };
  const handleToggleStatus = async (id) => {
    const userToToggle = users.find(u => u.id === id);
    const action = userToToggle.status === 'active' ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await deleteUser(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} failed`);
    }
  };

  const handleSave = async (payload) => {
    try {
      if (editing && editing.id) {
        await updateUser(editing.id, payload);
      } else {
        await createUser(payload);
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const canEdit = (targetUser) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SuperAdmin') return true;
    return targetUser.role !== 'SuperAdmin';
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || 
                         u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'Admin' || u.role === 'SuperAdmin').length
  };

  return (
    <div className="admin-console p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">User Management</h2>
          <p className="text-muted small mb-0">Manage administrative access and user permissions</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleAdd}>
          <span>➕</span> Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-white h-100" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 text-primary fs-4">👥</div>
              <div>
                <div className="text-muted small fw-bold text-uppercase">Total Users</div>
                <div className="fs-3 fw-bold">{stats.total}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-white h-100" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 text-success fs-4">✅</div>
              <div>
                <div className="text-muted small fw-bold text-uppercase">Active Accounts</div>
                <div className="fs-3 fw-bold">{stats.active}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-white h-100" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-danger bg-opacity-10 p-3 text-danger fs-4">🛡️</div>
              <div>
                <div className="text-muted small fw-bold text-uppercase">Admins</div>
                <div className="fs-3 fw-bold">{stats.admins}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">🔍</span>
                <input 
                  type="text" 
                  className="form-control bg-light border-start-0" 
                  placeholder="Search by username or email..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select 
                className="form-select bg-light" 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">SuperAdmin</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <UserManagementForm 
          initial={editing || {}} 
          onCancel={() => { setShowForm(false); setEditing(null); }} 
          onSave={handleSave} 
        />
      )}

      {loading ? (
        <div className="text-center p-5 bg-white rounded shadow-sm border-0">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading user database...</p>
        </div>
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm border-0" style={{ borderRadius: '12px' }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 border-0">User Account</th>
                <th className="py-3 border-0 text-center">Role</th>
                <th className="py-3 border-0 text-center">Status</th>
                <th className="py-3 border-0">Registered</th>
                <th className="py-3 border-0">Last Active</th>
                <th className="px-4 py-3 border-0 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map(u => {
                const editable = canEdit(u);
                const isDeactivated = u.status !== 'active';
                
                return (
                  <tr key={u.id} className={isDeactivated ? 'opacity-75' : ''}>
                    <td className="px-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm ${isDeactivated ? 'bg-secondary' : 'bg-primary'}`} style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={`fw-bold ${isDeactivated ? 'text-muted text-decoration-line-through' : 'text-dark'}`}>{u.username}</div>
                          <div className="small text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`badge rounded-pill px-3 py-2 ${u.role.toLowerCase() === 'superadmin' ? 'bg-dark shadow-sm' : 'bg-danger bg-opacity-75'}`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge rounded-pill px-3 py-2 ${u.status === 'active' ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                        ● {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td><small className="text-muted">{new Date(u.created_at).toLocaleDateString()}</small></td>
                    <td>
                      {u.last_login ? (
                        <div className="small">
                          <div className="text-dark fw-medium">{new Date(u.last_login).toLocaleDateString()}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(u.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : (
                        <small className="text-muted italic">Never logged in</small>
                      )}
                    </td>
                    <td className="px-4 text-end">
                      <div className="btn-group btn-group-sm bg-white shadow-sm rounded border overflow-hidden">
                        <button 
                          className="btn btn-white border-0 py-2 px-3 hover-bg-light" 
                          onClick={() => handleEdit(u)}
                          disabled={!editable}
                          title={!editable ? "Only SuperAdmins can edit other Admins" : "Edit user details"}
                        >
                          ✏️
                        </button>
                        <button 
                          className={`btn border-0 py-2 px-3 ${isDeactivated ? 'text-success' : 'text-danger'}`}
                          onClick={() => handleToggleStatus(u.id)}
                          disabled={!editable || u.id === currentUser?.id}
                          title={!editable ? "Only SuperAdmins can deactivate other Admins" : (u.id === currentUser?.id ? "You cannot deactivate yourself" : (isDeactivated ? 'Activate account' : 'Deactivate account'))}
                        >
                          {isDeactivated ? '🔓' : '🔒'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="fs-2 mb-2 opacity-25">🔍</div>
                    <div className="text-muted">No users found matching your search filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
