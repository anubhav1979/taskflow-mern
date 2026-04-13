const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { protect, managerOnly } = require('../middleware/authMiddleware');
const { sendTaskAssignmentEmail } = require('../utils/emailService');

// @route   POST /api/tasks
// @desc    Create a task (manager only)
router.post('/', protect, managerOnly, async (req, res) => {
  try {
    const { title, description, assignedEmail, projectId, priority, deadline } = req.body;

    const project = await Project.findOne({ _id: projectId, manager: req.user._id });
    if (!project) return res.status(403).json({ message: 'Not authorized for this project' });

    // Find the user by email
    const assignee = await User.findOne({ email: assignedEmail.toLowerCase() });
    if (!assignee) {
      return res.status(404).json({ message: 'No registered user found with this email. Add them to the project first, they need to register.' });
    }

    // Check if member is in project
    const isMember = project.members.find(m => m.email === assignedEmail.toLowerCase());
    if (!isMember) {
      return res.status(400).json({ message: 'This person is not a member of the project. Add them first.' });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      organization: project.organization,
      assignedTo: assignee._id,
      assignedEmail: assignedEmail.toLowerCase(),
      assignedBy: req.user._id,
      priority,
      deadline
    });

    // Update project member user ref if not set
    const member = project.members.find(m => m.email === assignedEmail.toLowerCase());
    if (member && !member.user) {
      member.user = assignee._id;
      await project.save();
    }

    // Add to org members
    await Organization.findByIdAndUpdate(
      project.organization,
      { $addToSet: { members: assignee._id } }
    );

    // Send email notification (non-blocking)
    sendTaskAssignmentEmail(assignedEmail, title, project.name, req.user.name).catch(console.error);

    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name');
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id/progress
// @desc    Update task progress (employee)
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { progress, note, status } = req.body;

    const task = await Task.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!task) return res.status(403).json({ message: 'Not authorized to update this task' });

    task.progress = progress;
    if (status) task.status = status;
    task.progressHistory.push({ note, percentage: progress });

    if (progress === 100) task.status = 'completed';

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name');

    res.json(task);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task (manager only)
router.put('/:id', protect, managerOnly, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedBy: req.user._id },
      req.body,
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task (manager only)
router.delete('/:id', protect, managerOnly, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, assignedBy: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/my
// @desc    Get employee's tasks in a project
// router.get('/my/:projectId', protect, async (req, res) => {
//   try {
//     const tasks = await Task.find({
//       project: req.params.projectId,
//       assignedTo: req.user._id
//     }).populate('assignedBy', 'name');
//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

router.get('/my/:projectId', protect, async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.params.projectId,
      $or: [
        { assignedTo: req.user._id },
        { assignedEmail: req.user.email.toLowerCase() }
      ]
    }).populate('assignedBy', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;