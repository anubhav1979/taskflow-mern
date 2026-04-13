import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ── Task Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status?.replace(' ', '-')}`}>
    {{ todo: '⏳', 'in-progress': '🔄', review: '👀', completed: '✅' }[status] || '•'} {status}
  </span>
);

const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>
    {{ low: '🟢', medium: '🟡', high: '🔴' }[priority] || '●'} {priority}
  </span>
);

// ── Add Member Modal ────────────────────────────────────────────────
const AddMemberModal = ({ projectId, onClose, onAdded }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post(`/projects/${projectId}/members`, { email });
      toast.success('Member added!');
      onAdded(res.data.project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">👤 Add Team Member</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Enter the email address of the employee you want to add to this project.
          They must be registered as an employee.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Employee Email</label>
            <input
              type="email" className="form-input"
              placeholder="employee@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Create Task Modal ───────────────────────────────────────────────
const CreateTaskModal = ({ projectId, members, onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', description: '', assignedEmail: '', priority: 'medium', deadline: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const aiSuggestDesc = async () => {
    if (!form.title) { toast.error('Enter a task title first'); return; }
    setAiLoading(true);
    try {
      const res = await API.post('/ai/suggest', { type: 'task_description', context: { title: form.title } });
      setForm(f => ({ ...f, description: res.data.suggestion }));
      toast.success('AI description generated!');
    } catch { toast.error('AI unavailable'); }
    finally { setAiLoading(false); }
  };

  const aiSuggestPriority = async () => {
    if (!form.title) { toast.error('Enter a task title first'); return; }
    setAiLoading(true);
    try {
      const res = await API.post('/ai/suggest', { type: 'priority', context: { title: form.title, deadline: form.deadline } });
      const p = res.data.suggestion.toLowerCase().trim();
      if (['low', 'medium', 'high'].includes(p)) {
        setForm(f => ({ ...f, priority: p }));
        toast.success(`AI suggests: ${p} priority`);
      }
    } catch { toast.error('AI unavailable'); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const task = await API.post('/tasks', { ...form, projectId });
      toast.success('Task created and assigned!');
      onCreated(task.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">✅ Create Task</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input type="text" name="title" className="form-input" placeholder="e.g. Design login page" value={form.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Description</label>
              <button type="button" className="ai-btn" onClick={aiSuggestDesc} disabled={aiLoading}>
                {aiLoading ? '⏳' : '🤖'} AI Suggest
              </button>
            </div>
            <textarea name="description" className="form-input" placeholder="Describe what needs to be done..." value={form.description} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select name="assignedEmail" className="form-input" value={form.assignedEmail} onChange={handleChange} required>
              <option value="">Select team member...</option>
              {members.map(m => (
                <option key={m.email} value={m.email}>
                  {m.user?.name ? `${m.user.name} (${m.email})` : m.email}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Priority</label>
                <button type="button" className="ai-btn" onClick={aiSuggestPriority} disabled={aiLoading} style={{ fontSize: '11px', padding: '3px 7px' }}>
                  🤖 AI
                </button>
              </div>
              <select name="priority" className="form-input" value={form.priority} onChange={handleChange}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="date" name="deadline" className="form-input" value={form.deadline} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Update Progress Modal ──────────────────────────────────────────
const UpdateProgressModal = ({ task, onClose, onUpdated }) => {
  const [progress, setProgress] = useState(task.progress || 0);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(task.status);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const aiSuggestNote = async () => {
    setAiLoading(true);
    try {
      const res = await API.post('/ai/suggest', { type: 'progress_note', context: { progress, taskTitle: task.title } });
      setNote(res.data.suggestion);
      toast.success('AI note generated!');
    } catch { toast.error('AI unavailable'); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put(`/tasks/${task._id}/progress`, { progress, note, status });
      toast.success('Progress updated!');
      onUpdated(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📊 Update Progress</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '16px', fontSize: '15px' }}>{task.title}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Progress: {progress}%</label>
            <input
              type="range" min="0" max="100" value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <div className="progress-bar-container" style={{ marginTop: '8px' }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="todo">⏳ Todo</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="review">👀 Review</option>
              <option value="completed">✅ Completed</option>
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Progress Note</label>
              <button type="button" className="ai-btn" onClick={aiSuggestNote} disabled={aiLoading}>
                {aiLoading ? '⏳' : '🤖'} AI Suggest
              </button>
            </div>
            <textarea className="form-input" placeholder="What have you done? Any blockers?" value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Updating...' : 'Update Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Project View ───────────────────────────────────────────────
const ProjectView = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === 'manager';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [modal, setModal] = useState(null); // 'addMember' | 'createTask' | task object for progress

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/projects/${projectId}`);
      setProject(res.data.project);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project');
      if (err.response?.status === 403) navigate(-1);
    } finally { setLoading(false); }
  }, [projectId, navigate]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleTaskCreated = (task) => setTasks(prev => [task, ...prev]);
  const handleTaskUpdated = (updated) => setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
  const handleMemberAdded = (updatedProject) => setProject(updatedProject);

  const handleRemoveMember = async (email) => {
    if (!window.confirm(`Remove ${email} from project?`)) return;
    try {
      await API.delete(`/projects/${projectId}/members/${encodeURIComponent(email)}`);
      setProject(prev => ({ ...prev, members: prev.members.filter(m => m.email !== email) }));
      toast.success('Member removed');
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  // Group tasks by member for manager view
  const tasksByMember = {};
  tasks.forEach(t => {
    const email = t.assignedTo?.email || t.assignedEmail;
    if (!tasksByMember[email]) tasksByMember[email] = { user: t.assignedTo, tasks: [] };
    tasksByMember[email].tasks.push(t);
  });

  //const myTasks = tasks.filter(t => t.assignedTo?._id === user?._id);

  const myTasks = tasks.filter(t => 
    t.assignedTo?._id === user?._id || 
    t.assignedEmail === user?.email?.toLowerCase()
  );

  const getOverallProgress = (memberTasks) => {
    if (!memberTasks.length) return 0;
    return Math.round(memberTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / memberTasks.length);
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner"></div>
      </div>
    </>
  );

  if (!project) return null;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {/* Back button */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back to Dashboard
        </button>

        {/* Project Header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>{project.name}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, maxWidth: '600px' }}>
                {project.description || 'No description provided'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className={`badge badge-${project.status === 'active' ? 'in-progress' : project.status === 'completed' ? 'completed' : 'todo'}`}>
                {project.status}
              </span>
              {project.deadline && (
                <span className="deadline-text">📅 Due {new Date(project.deadline).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>👥 {project.members?.length || 0} members</span>
            <span>✅ {tasks.length} tasks</span>
            <span>✔️ {tasks.filter(t => t.status === 'completed').length} completed</span>
            {isManager && <span style={{ color: 'var(--text-secondary)' }}>Manager: You</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            ✅ Tasks
          </button>
          <button className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
            👥 Team
          </button>
          {isManager && (
            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              📊 Overview
            </button>
          )}
        </div>

        {/* ─── TASKS TAB ─────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div>
            <div className="section-header">
              <h2 className="section-title">
                {isManager ? 'All Tasks' : 'My Tasks'}
              </h2>
              {isManager && (
                <button className="btn btn-primary" onClick={() => setModal('createTask')}>
                  + Assign Task
                </button>
              )}
            </div>

            {(isManager ? tasks : myTasks).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>{isManager ? 'No tasks yet' : 'No tasks assigned to you'}</h3>
                <p>{isManager ? 'Create tasks and assign them to team members' : 'Your manager will assign tasks soon'}</p>
                {isManager && (
                  <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setModal('createTask')}>
                    + Assign First Task
                  </button>
                )}
              </div>
            ) : (
              (isManager ? tasks : myTasks).map(task => (
                <div key={task._id} className="task-card">
                  <div className="task-header">
                    <div style={{ flex: 1 }}>
                      <div className="task-title">{task.title}</div>
                      {task.description && <div className="task-desc">{task.description}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>

                  <div className="task-meta">
                    <span className="task-assignee">
                      👤 {task.assignedTo?.name || task.assignedEmail}
                      {isManager && ` · Assigned by you`}
                    </span>
                    {task.deadline && (
                      <span className="deadline-text">📅 {new Date(task.deadline).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="task-progress-row">
                    <span className="task-progress-label">{task.progress || 0}%</span>
                    <div className="progress-bar-container" style={{ flex: 1 }}>
                      <div className="progress-bar-fill" style={{ width: `${task.progress || 0}%` }}></div>
                    </div>
                    {!isManager && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(task)}>
                        Update
                      </button>
                    )}
                    {isManager && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task._id)}>
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Progress history */}
                  {task.progressHistory?.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Recent updates:</div>
                      {task.progressHistory.slice(-2).reverse().map((h, i) => (
                        <div key={i} className="progress-history-item">
                          <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontSize: '11px' }}>{h.percentage}%</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{h.note || 'No note'}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {new Date(h.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TEAM TAB ──────────────────────────────────────── */}
        {activeTab === 'team' && (
          <div>
            <div className="section-header">
              <h2 className="section-title">Team Members</h2>
              {isManager && (
                <button className="btn btn-primary" onClick={() => setModal('addMember')}>
                  + Add Member
                </button>
              )}
            </div>

            {(!project.members || project.members.length === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>No team members yet</h3>
                <p>{isManager ? 'Add members using their email addresses' : 'No members added yet'}</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <table className="team-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Email</th>
                      <th>Tasks</th>
                      <th>Progress</th>
                      {isManager && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {project.members.map((member, idx) => {
                      const memberTasks = tasksByMember[member.email]?.tasks || [];
                      const avg = getOverallProgress(memberTasks);
                      return (
                        <tr key={idx}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="member-avatar">{(member.user?.name || member.email).charAt(0).toUpperCase()}</div>
                              <span>{member.user?.name || '—'}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{member.email}</td>
                          <td>
                            <span className="badge badge-in-progress">{memberTasks.length}</span>
                          </td>
                          <td style={{ minWidth: '120px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="progress-bar-container" style={{ flex: 1 }}>
                                <div className="progress-bar-fill" style={{ width: `${avg}%` }}></div>
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{avg}%</span>
                            </div>
                          </td>
                          {isManager && (
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(member.email)}>
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── OVERVIEW TAB (Manager only) ───────────────────── */}
        {activeTab === 'overview' && isManager && (
          <div>
            <h2 className="section-title" style={{ marginBottom: '20px' }}>Progress Overview</h2>
            {Object.keys(tasksByMember).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3>No tasks assigned yet</h3>
              </div>
            ) : (
              Object.entries(tasksByMember).map(([email, data]) => {
                const avg = getOverallProgress(data.tasks);
                return (
                  <div key={email} className="card" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{data.user?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>{avg}%</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>avg. progress</div>
                      </div>
                    </div>
                    <div className="progress-bar-container" style={{ height: '10px', marginBottom: '14px' }}>
                      <div className="progress-bar-fill" style={{ width: `${avg}%` }}></div>
                    </div>
                    {data.tasks.map(t => (
                      <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderTop: '1px solid var(--border)', fontSize: '13px' }}>
                        <span style={{ flex: 1 }}>{t.title}</span>
                        <StatusBadge status={t.status} />
                        <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{t.progress || 0}%</span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'addMember' && (
        <AddMemberModal projectId={projectId} onClose={() => setModal(null)} onAdded={handleMemberAdded} />
      )}
      {modal === 'createTask' && (
        <CreateTaskModal
          projectId={projectId}
          members={project.members || []}
          onClose={() => setModal(null)}
          onCreated={handleTaskCreated}
        />
      )}
      {modal && typeof modal === 'object' && (
        <UpdateProgressModal task={modal} onClose={() => setModal(null)} onUpdated={handleTaskUpdated} />
      )}
    </>
  );
};

export default ProjectView;