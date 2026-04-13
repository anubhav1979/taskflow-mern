const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Organization = require('../models/Organization');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, managerOnly } = require('../middleware/authMiddleware');

// @route   POST /api/projects
// @desc    Create a new project (manager only)
router.post('/', protect, managerOnly, async (req, res) => {
  try {
    const { name, description, deadline, organizationId } = req.body;

    const org = await Organization.findOne({ _id: organizationId, manager: req.user._id });
    if (!org) return res.status(403).json({ message: 'Not authorized for this organization' });

    const project = await Project.create({
      name,
      description,
      deadline,
      organization: organizationId,
      manager: req.user._id
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project details with members and tasks
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('manager', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Employee: check access
    if (req.user.role === 'employee') {
      const hasTask = await Task.findOne({
        project: req.params.id,
        $or: [
          { assignedTo: req.user._id },
          { assignedEmail: req.user.email.toLowerCase() }
        ]
      });
      if (!hasTask) {
        return res.status(403).json({ message: '🚫 No assigned work in this project.' });
      }
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name');

    res.json({ project, tasks });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add member to project by email
router.post('/:id/members', protect, managerOnly, async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findOne({ _id: req.params.id, manager: req.user._id });
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    // Check if already added
    const alreadyMember = project.members.find(m => m.email === email.toLowerCase());
    if (alreadyMember) {
      return res.status(400).json({ message: 'Member already added to project' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase(), role: 'employee' });

    project.members.push({
      user: user ? user._id : null,
      email: email.toLowerCase()
    });
    await project.save();

    // Add user to org members if exists
    if (user) {
      await Organization.findByIdAndUpdate(
        project.organization,
        { $addToSet: { members: user._id } }
      );
    }

    await project.populate('members.user', 'name email');
    res.json({ message: 'Member added successfully', project });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id/members/:email
// @desc    Remove member from project
router.delete('/:id/members/:email', protect, managerOnly, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, manager: req.user._id });
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    project.members = project.members.filter(m => m.email !== req.params.email);
    await project.save();
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
router.put('/:id', protect, managerOnly, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, manager: req.user._id },
      req.body,
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;