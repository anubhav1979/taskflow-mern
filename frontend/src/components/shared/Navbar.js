import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const dashboardLink = user?.role === 'manager' ? '/manager/dashboard' : '/employee/dashboard';

  return (
    <nav className="navbar">
      <Link to={dashboardLink} className="navbar-brand">⚡ TaskFlow</Link>
      <div className="navbar-right">
        {organization && (
          <span style={{
            fontSize: '13px', color: 'var(--text-muted)',
            background: 'var(--bg-hover)', padding: '4px 10px',
            borderRadius: '6px', border: '1px solid var(--border)'
          }}>
            🏢 {organization.name}
          </span>
        )}
        <div className="user-chip">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <span>{user?.name}</span>
          <span style={{
            fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
            background: user?.role === 'manager' ? 'rgba(56,189,248,0.15)' : 'rgba(167,139,250,0.15)',
            color: user?.role === 'manager' ? 'var(--accent)' : 'var(--purple)',
          }}>
            {user?.role}
          </span>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;