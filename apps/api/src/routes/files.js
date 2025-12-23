const express = require('express');
const authenticateToken = require('../middleware/auth');
const {
  upload,
  uploadMilestoneDeliverable,
  uploadProjectFile,
  downloadFile,
  getMilestoneFiles,
  getProjectFiles,
  deleteFile
} = require('../controllers/fileController');

const router = express.Router();

// Upload milestone deliverable
router.post('/milestone/:projectId/:milestoneId', authenticateToken, upload.single('file'), uploadMilestoneDeliverable);

// Upload project-related file
router.post('/project/:projectId', authenticateToken, upload.single('file'), uploadProjectFile);

// Download file
router.get('/download/:filename', authenticateToken, downloadFile);

// Get milestone files
router.get('/milestone/:projectId/:milestoneId', authenticateToken, getMilestoneFiles);

// Get project files
router.get('/project/:projectId', authenticateToken, getProjectFiles);

// Delete file
router.delete('/delete/:filename', authenticateToken, deleteFile);

module.exports = router;