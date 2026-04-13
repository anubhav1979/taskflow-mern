import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CreateProjectModal = ({ orgId, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', description: '', deadline: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const aiSuggestDesc = async () => {
    if (!form.name) { toast.error('Enter a project name first'); return; }
    setAiLoading(true);
    try {
      const res = await API.post('/ai/suggest', { type: 'project_description', context: { name: form.name } });
      setForm(f => ({ ...f, description: res.data.suggestion }));
      toast.success('AI description generated!');
    } catch { toast.error('AI unavailable'); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = await API.post('/projects', { ...form, organizationId: orgId });
      toast.success('Project created!');
      onCreated(project.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📋 New Project</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input type="text" name="name" className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Description</label>
              <button type="button" className="ai-btn" onClick={aiSuggestDesc} disabled={aiLoading}>
                {aiLoading ? '⏳' : '🤖'} AI Suggest
              </button>
            </div>
            <textarea name="description" className="form-input" placeholder="What is this project about?" value={form.description} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Deadline (optional)</label>
            <input type="date" name="deadline" className="form-input" value={form.deadline} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManagerDashboard = () => {
  const { organization } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const res = await API.get(`/organizations/${organization._id}/projects`);
      setProjects(res.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally { setLoading(false); }
  }, [organization]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    members: [...new Set(projects.flatMap(p => p.members?.map(m => m.email) || []))].length
  };

  const getStatusColor = (status) => {
    const colors = { active: 'var(--green)', planning: 'var(--accent)', completed: 'var(--purple)', 'on-hold': 'var(--yellow)' };
    return colors[status] || 'var(--text-muted)';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        {/* Welcome */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>
            🏢 {organization?.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage your projects and team members
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--purple)' }}>{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>{stats.members}</div>
            <div className="stat-label">Team Members</div>
          </div>
        </div>

        {/* Projects */}
        <div className="section-header">
          <h2 className="section-title">Your Projects</h2>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Project
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowCreate(true)}>
              + Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project._id} className="project-card" onClick={() => navigate(`/project/${project._id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: getStatusColor(project.status), textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ● {project.status}
                  </span>
                  {project.deadline && (
                    <span className="deadline-text">
                      📅 {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="project-card-title">{project.name}</div>
                <div className="project-card-desc">
                  {project.description || 'No description provided'}
                </div>
                <div className="project-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      👥 {project.members?.length || 0} members
                    </span>
                  </div>
                  <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>
                    Open →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && organization && (
        <CreateProjectModal
          orgId={organization._id}
          onClose={() => setShowCreate(false)}
          onCreated={(p) => setProjects(prev => [p, ...prev])}
        />
      )}
    </>
  );
};

export default ManagerDashboard;