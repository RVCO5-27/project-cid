import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './admin-console.css';

import { getAllUsers } from '../services/adminUsers';

import { getAllCarouselSlides } from '../services/carousel';
import { getOrganizationalChart } from '../services/organizationalChart';

import { getStatsSummary } from '../services/stats';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, carousel: 0, orgChart: false, issuances: 0, schools: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users, slides, chart, summary] = await Promise.all([
          getAllUsers(),
          getAllCarouselSlides(),
          getOrganizationalChart(),
          getStatsSummary()
        ]);
        setStats({
          users: users.length,
          carousel: slides.length,
          orgChart: !!chart,
          issuances: summary.issuances,
          schools: summary.schools
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="admin-console">
      <div className="admin-console__banner">
        <span>
          Administrator console — same portal layout as the public site. Manage records from the sidebar.
        </span>
        <NavLink to="/home">View public site</NavLink>
      </div>

      <h2 className="h4 mb-3">Overview</h2>
      <div className="admin-console__stats">
        <div className="admin-console__stat">
          <NavLink to="/admin/users" style={{ textDecoration: 'none', color: 'inherit' }}>
            <label>Users</label>
            <span>{stats.users}</span>
          </NavLink>
        </div>
        <div className="admin-console__stat">
          <NavLink to="/admin/schools" style={{ textDecoration: 'none', color: 'inherit' }}>
            <label>Schools</label>
            <span>{stats.schools}</span>
          </NavLink>
        </div>
        <div className="admin-console__stat">
          <NavLink to="/admin/carousel" style={{ textDecoration: 'none', color: 'inherit' }}>
            <label>Carousel Slides</label>
            <span>{stats.carousel || 0}</span>
          </NavLink>
        </div>
        <div className="admin-console__stat">
          <NavLink to="/admin/organizational-chart" style={{ textDecoration: 'none', color: 'inherit' }}>
            <label>Org Chart</label>
            <span>{stats.orgChart ? 'Set' : 'Not Set'}</span>
          </NavLink>
        </div>
        <div className="admin-console__stat">
          <NavLink to="/admin/issuances-mgmt" style={{ textDecoration: 'none', color: 'inherit' }}>
            <label>Issuances</label>
            <span>{stats.issuances}</span>
          </NavLink>
        </div>
      </div>

      <p className="text-muted small mt-4 mb-0">
        All overview cards are now connected to the real-time database.
      </p>
    </div>
  );
}
