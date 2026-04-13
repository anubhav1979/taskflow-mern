import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const features = [
    { icon: '🏢', title: 'Organization Management', desc: 'Managers create organizations and invite team members via email.' },
    { icon: '📋', title: 'Project Tracking', desc: 'Create projects, set deadlines, and monitor progress in real time.' },
    { icon: '✅', title: 'Task Assignment', desc: 'Assign tasks with priorities, deadlines, and track updates live.' },
    { icon: '📊', title: 'Progress Monitoring', desc: 'Visual progress bars and history logs keep everyone aligned.' },
    { icon: '🤖', title: 'AI Assistance', desc: 'AI suggests task descriptions, priorities, and progress notes.' },
    { icon: '🔒', title: 'Role-based Access', desc: 'Managers and employees each see exactly what they need.' },
  ];

  return (
    <div className="landing">
      <nav className="navbar">
        <span className="navbar-brand">⚡ TaskFlow</span>
        <div className="navbar-right">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      <div className="landing-hero">
        <div className="hero-badge">✨ AI-Powered Task Management</div>
        <h1 className="hero-title">
          Manage Teams.<br /><span>Deliver Results.</span>
        </h1>
        <p className="hero-subtitle">
          TaskFlow brings managers and employees together with smart task tracking, 
          real-time progress updates, and AI-powered assistance.
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-primary btn-lg">Start Free →</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </div>

      <div className="features-grid">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '0 24px 60px', color: 'var(--text-muted)', fontSize: '13px' }}>
        Built with MERN Stack · Powered by Claude AI
      </div>
    </div>
  );
};

export default Landing;