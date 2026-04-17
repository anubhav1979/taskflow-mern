const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/organizations/search/:name
// @desc    Search org by name (for employees to join)
router.get('/search/:name', protect, async (req, res) => {
  try {
    const org = await Organization.findOne({
      name: { $regex: new RegExp(`^${req.params.name.trim()}$`, 'i') }
    }).populate('manager', 'name email');

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if employee has any tasks in this org
    if (req.user.role === 'employee') {
      const tasks = await Task.find({
        organization: org._id,
        $or: [
          { assignedTo: req.user._id },
          { assignedEmail: req.user.email.toLowerCase() }
        ]
      });
      if (tasks.length === 0) {
        return res.status(403).json({
          message: 'No assigned work found in this organization. Please contact your manager.'
        });
      }
    }

    res.json(org);
  } catch (error) {
    console.error('Search org error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/organizations/my
// @desc    Get manager's organization
router.get('/my', protect, async (req, res) => {
  try {
    const org = await Organization.findOne({ manager: req.user._id });
    if (!org) return res.status(404).json({ message: 'No organization found' });
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/organizations/:id/projects
// @desc    Get all projects in an organization
router.get('/:id/projects', protect, async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    let projects;
    if (req.user.role === 'manager') {
      // Manager sees all their projects
      projects = await Project.find({
        organization: req.params.id,
        manager: req.user._id
      }).populate('members.user', 'name email');
    } else {
      // Employee sees all projects but with access flag
      projects = await Project.find({
        organization: req.params.id
      }).populate('members.user', 'name email');

      // Check which projects employee has tasks in
      // const employeeTasks = await Task.find({
      //   organization: req.params.id,
      //   assignedTo: req.user._id
      // }).select('project');

      const employeeTasks = await Task.find({
        organization: req.params.id,
        $or: [
          { assignedTo: req.user._id },
          { assignedEmail: req.user.email.toLowerCase() }
        ]
      }).select('project');

      const projectsWithTasks = new Set(employeeTasks.map(t => t.project.toString()));

      projects = projects.map(p => ({
        ...p.toObject(),
        hasAccess: projectsWithTasks.has(p._id.toString())
      }));
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;