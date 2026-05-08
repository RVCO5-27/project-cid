import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import RequireHttps from './components/RequireHttps.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Issuances from './pages/Issuances.jsx';
import OrganizationalChart from './pages/OrganizationalChart.jsx';
import PublicSchools from './pages/PublicSchools.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import CreateAdmin from './pages/CreateAdmin.jsx';
import AdminRecovery from './pages/AdminRecovery.jsx';
import AdminChangePassword from './pages/AdminChangePassword.jsx';
import UserManagementPage from './pages/UserManagement';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminIssuancesMgmt from './pages/AdminIssuancesMgmt.jsx';
import AdminProfile from './pages/AdminProfile.jsx';
import SchoolManagement from './pages/SchoolManagement.jsx';
import AuditLogManagement from './pages/AuditLogManagement.jsx';
import CarouselManagementPage from './pages/CarouselManagement';
import IssuanceManagementPage from './pages/IssuanceManagement';
import OrganizationalChartManagementPage from './pages/OrganizationalChartManagement';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext.jsx';
import './App.css';

function AdminShell({ children }) {
  return (
    <RequireHttps>
      <Layout variant="admin">{children}</Layout>
    </RequireHttps>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="issuances" element={<Issuances />} />
            <Route path="org-chart" element={<OrganizationalChart />} />
            <Route path="schools" element={<PublicSchools />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/create-admin" element={<RequireHttps><CreateAdmin /></RequireHttps>} />
          <Route path="/admin/login" element={<RequireHttps><AdminLogin /></RequireHttps>} />
          <Route path="/admin/reset-access" element={<RequireHttps><AdminRecovery /></RequireHttps>} />
          <Route path="/admin/change-password" element={<RequireHttps><AdminChangePassword /></RequireHttps>} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminShell>
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              </AdminShell>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminShell>
                <PrivateRoute>
                  <UserManagementPage />
                </PrivateRoute>
              </AdminShell>
            }
          />
          <Route
          path="/admin/carousel"
          element={
            <AdminShell>
              <PrivateRoute>
                <CarouselManagementPage />
              </PrivateRoute>
            </AdminShell>
          }
        />
        <Route
          path="/admin/issuances-mgmt"
          element={
            <AdminShell>
              <PrivateRoute>
                <IssuanceManagementPage />
              </PrivateRoute>
            </AdminShell>
          }
        />
          <Route
            path="/admin/organizational-chart"
            element={
              <AdminShell>
                <PrivateRoute>
                  <OrganizationalChartManagementPage />
                </PrivateRoute>
              </AdminShell>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <AdminShell>
                <PrivateRoute>
                  <AdminProfile />
                </PrivateRoute>
              </AdminShell>
            }
          />
          <Route
            path="/admin/schools"
            element={
              <AdminShell>
                <PrivateRoute>
                  <SchoolManagement />
                </PrivateRoute>
              </AdminShell>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <AdminShell>
                <PrivateRoute>
                  <AuditLogManagement />
                </PrivateRoute>
              </AdminShell>
            }
          />

          {/* Redirects */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
