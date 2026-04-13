import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';

const Register = () => {
  const [role, setRole] = useState('employee');
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/register', { ...form, role });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ marginBottom: '10px' }}>Check your email!</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
            We sent a verification link to <strong style={{ color: 'var(--accent)' }}>{form.email}</strong>.<br />
            Click the link to activate your account.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>⚡ TaskFlow</h1>
          <p>Smart task management for teams</p>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join TaskFlow and start managing work</p>

        {/* Role Selector */}
        <div className="form-group">
          <label className="form-label">I am a...</label>
          <div className="role-selector">
            <div
              className={`role-option ${role === 'manager' ? 'selected' : ''}`}
              onClick={() => setRole('manager')}
            >
              <div className="role-icon">👔</div>
              <div className="role-name">Manager</div>
              <div className="role-desc">Create org & projects</div>
            </div>
            <div
              className={`role-option ${role === 'employee' ? 'selected' : ''}`}
              onClick={() => setRole('employee')}
            >
              <div className="role-icon">💼</div>
              <div className="role-name">Employee</div>
              <div className="role-desc">View & update tasks</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text" name="name" className="form-input"
              placeholder="John Doe"
              value={form.name} onChange={handleChange} required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" name="email" className="form-input"
              placeholder="john@company.com"
              value={form.email} onChange={handleChange} required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" name="password" className="form-input"
              placeholder="Min. 6 characters"
              value={form.password} onChange={handleChange} required
            />
          </div>

          {role === 'manager' && (
            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input
                type="text" name="organizationName" className="form-input"
                placeholder="e.g. Acme Corp, DevTeam India"
                value={form.organizationName} onChange={handleChange} required
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                This name will be used by employees to find your organization
              </p>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;