import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import API from '../utils/api';

const EmployeeDashboard = () => {
  const [orgName, setOrgName] = useState('');
  const [organization, setOrganization] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  // Check if employee was previously in an org (stored in session)
  useEffect(() => {
    const savedOrg = sessionStorage.getItem('emp_org');
    if (savedOrg) {
      const parsed = JSON.parse(savedOrg);
      setOrganization(parsed);
      fetchProjects(parsed._id);
    }
  }, []);

  const handleSearchOrg = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setSearching(true);
    try {
      const res = await API.get(`/organizations/search/${encodeURIComponent(orgName.trim())}`);
      setOrganization(res.data);
      sessionStorage.setItem('emp_org', JSON.stringify(res.data));
      toast.success(`Found organization: ${res.data.name}`);
      fetchProjects(res.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Organization not found');
    } finally { setSearching(false); }
  };

  const fetchProjects = async (orgId) => {
    setLoading(true);
    try {
      const res = await API.get(`/organizations/${orgId}/projects`);
      setProjects(res.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally { setLoading(false); }
  };

  const handleProjectClick = async (project) => {
    if (!project.hasAccess) {
      toast.error('🚫 You have no assigned work in this project.');
      return;
    }
    navigate(`/project/${project._id}`);
  };

  const handleLeaveOrg = () => {
    sessionStorage.removeItem('emp_org');
    setOrganization(null);
    setProjects([]);
    setOrgName('');
  };

  const myProjects = projects.filter(p => p.hasAccess);
  const otherProjects = projects.filter(p => !p.hasAccess);

  return (
    <>
      <Navbar />
      <div className="page-container">
        {!organization ? (
          // Search org screen
          <div style={{ maxWidth: '480px', margin: '80px auto', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏢</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Find Your Organization</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              Enter the name of your organization to access your assigned projects and tasks.
            </p>
            <form onSubmit={handleSearchOrg}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter organization name..."
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '16px' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={searching}>
                {searching ? 'Searching...' : 'Find Organization →'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Org header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800 }}>🏢 {organization.name}</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Your assigned projects and tasks
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLeaveOrg}>
                ← Switch Org
              </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '28px' }}>
              <div className="stat-card">
                <div className="stat-value">{projects.length}</div>
                <div className="stat-label">Total Projects</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--green)' }}>{myProjects.length}</div>
                <div className="stat-label">My Projects</div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                Loading projects...
              </div>
            ) : (
              <>
                {/* My Projects */}
                <div className="section-header">
                  <h2 className="section-title">My Projects <span style={{ color: 'var(--green)', fontSize: '14px' }}>● Active</span></h2>
                </div>

                {myProjects.length === 0 ? (
                  <div className="empty-state" style={{ marginBottom: '32px' }}>
                    <div className="empty-state-icon">📭</div>
                    <h3>No assigned projects</h3>
                    <p>Your manager hasn't assigned any tasks yet</p>
                  </div>
                ) : (
                  <div className="projects-grid" style={{ marginBottom: '32px' }}>
                    {myProjects.map(project => (
                      <div key={project._id} className="project-card" onClick={() => handleProjectClick(project)}>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase' }}>
                            ● {project.status}
                          </span>
                        </div>
                        <div className="project-card-title">{project.name}</div>
                        <div className="project-card-desc">{project.description || 'No description'}</div>
                        <div className="project-card-footer">
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            👥 {project.members?.length || 0} members
                          </span>
                          <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>
                            Open →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Other Projects */}
                {otherProjects.length > 0 && (
                  <>
                    <div className="section-header">
                      <h2 className="section-title" style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
                        Other Projects in Organization
                      </h2>
                    </div>
                    <div className="projects-grid">
                      {otherProjects.map(project => (
                        <div
                          key={project._id}
                          className="project-card no-access"
                          onClick={() => toast('🚫 No assigned work in this project.')}
                        >
                          <div className="project-card-title" style={{ color: 'var(--text-muted)' }}>{project.name}</div>
                          <div className="project-card-desc">{project.description || 'No description'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            🔒 No access — not assigned to this project
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default EmployeeDashboard;