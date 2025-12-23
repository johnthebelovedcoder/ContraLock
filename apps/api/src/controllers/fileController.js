const { Project, Milestone, User } = require('../models/modelManager');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../errors/AppError');
const fileService = require('../services/fileService');

// Configure multer for file uploads - use temporary directory for processing
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create temp uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', '..', '..', 'temp_uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images, pdfs, and common document formats
    if (file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, DOCs, and TXT files are allowed.'));
    }
  }
});

// Upload file for milestone deliverable
const uploadMilestoneDeliverable = async (req, res, next) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user.userId;

    // Verify file was uploaded
    if (!req.file) {
      return next(new BadRequestError('No file uploaded'));
    }

    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    if (project.client.toString() !== userId && project.freelancer.toString() !== userId) {
      return next(new ForbiddenError('Not authorized to access this project'));
    }

    // Verify milestone belongs to project
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone || milestone.project.toString() !== projectId) {
      return next(new NotFoundError('Milestone not found in project'));
    }

    // Verify user is freelancer (only freelancer can upload deliverables)
    if (project.freelancer.toString() !== userId) {
      return next(new ForbiddenError('Only the assigned freelancer can upload deliverables'));
    }

    // Verify milestone is in proper state for deliverable upload
    if (milestone.status !== 'IN_PROGRESS' && milestone.status !== 'REVISION_REQUESTED') {
      return next(new BadRequestError('Deliverable can only be uploaded in progress or revision requested state'));
    }

    // Upload file using file service
    const uploadResult = await fileService.uploadFile(req.file, {
      folder: `projects/${projectId}/milestones/${milestoneId}`,
      maxSize: 25 * 1024 * 1024 // 25MB for deliverables
    });

    // Add file to milestone deliverables
    const deliverable = {
      ...uploadResult,
      uploadedBy: userId,
      uploadedAt: new Date()
    };

    if (!milestone.deliverables) {
      milestone.deliverables = [];
    }
    milestone.deliverables.push(deliverable);

    await milestone.save();

    res.status(201).json({
      message: 'Deliverable uploaded successfully',
      deliverable: {
        id: deliverable.filename,
        originalName: deliverable.originalName,
        size: deliverable.size,
        url: fileService.getFileUrl(deliverable),
        uploadedAt: deliverable.uploadedAt
      }
    });
  } catch (error) {
    // Clean up uploaded file if error occurred
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    next(error);
  }
};

// Upload project-related file (for evidence in disputes, agreements, etc.)
const uploadProjectFile = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { purpose = 'general' } = req.body;
    const userId = req.user.userId;

    // Verify file was uploaded
    if (!req.file) {
      return next(new BadRequestError('No file uploaded'));
    }

    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    if (project.client.toString() !== userId && project.freelancer.toString() !== userId) {
      return next(new ForbiddenError('Not authorized to access this project'));
    }

    // Upload file using file service
    const uploadResult = await fileService.uploadFile(req.file, {
      folder: `projects/${projectId}/files`,
      maxSize: 50 * 1024 * 1024 // 50MB for project files
    });

    // Add file to project files (store in project's activity log or metadata)
    const projectFile = {
      ...uploadResult,
      purpose: purpose,
      uploadedBy: userId,
      uploadedAt: new Date()
    };

    if (!project.files) {
      project.files = [];
    }
    project.files.push(projectFile);

    await project.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: projectFile.filename,
        originalName: projectFile.originalName,
        size: projectFile.size,
        purpose: projectFile.purpose,
        url: fileService.getFileUrl(projectFile),
        uploadedAt: projectFile.uploadedAt
      }
    });
  } catch (error) {
    // Clean up uploaded file if error occurred
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    next(error);
  }
};

// Download file
const downloadFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const userId = req.user.userId;

    // Verify file path is safe
    const safeFilename = path.basename(filename);

    if (process.env.FILE_STORAGE_TYPE === 'local') {
      // For local files, check if file exists in uploads
      const filePath = path.join(__dirname, '..', '..', '..', 'uploads', safeFilename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return next(new NotFoundError('File not found'));
      }

      // In a real implementation, you would verify the user has access to this file
      // by checking if it's associated with a project the user is part of
      res.download(filePath);
    } else {
      // For cloud storage, redirect to the public URL or serve through a proxy
      const fileInfo = await fileService.getFileInfo(safeFilename);
      if (!fileInfo) {
        return next(new NotFoundError('File not found'));
      }

      // In a real implementation, check if user has access to the file
      // For S3, we might redirect or proxy the content based on security requirements
      if (fileInfo.storageType === 's3') {
        // Redirect to S3 URL for public access or proxy if additional security is needed
        res.redirect(302, fileInfo.publicUrl);
      }
    }
  } catch (error) {
    next(error);
  }
};

// Get files for a milestone
const getMilestoneFiles = async (req, res, next) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    if (project.client.toString() !== userId && project.freelancer.toString() !== userId) {
      return next(new ForbiddenError('Not authorized to access this project'));
    }

    // Verify milestone belongs to project
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone || milestone.project.toString() !== projectId) {
      return next(new NotFoundError('Milestone not found in project'));
    }

    res.json({
      files: milestone.deliverables || []
    });
  } catch (error) {
    next(error);
  }
};

// Get files for a project
const getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    if (project.client.toString() !== userId && project.freelancer.toString() !== userId) {
      return next(new ForbiddenError('Not authorized to access this project'));
    }

    res.json({
      files: project.files || []
    });
  } catch (error) {
    next(error);
  }
};

// Delete file
const deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const { entityType, entityId } = req.body; // 'milestone' or 'project'
    const userId = req.user.userId;

    const safeFilename = path.basename(filename);

    // Verify user has access to the entity that contains the file
    if (entityType === 'milestone') {
      const milestone = await Milestone.findById(entityId);
      if (!milestone) {
        return next(new NotFoundError('Milestone not found'));
      }

      const project = await Project.findById(milestone.project);
      if (project.client.toString() !== userId && project.freelancer.toString() !== userId) {
        return next(new ForbiddenError('Not authorized to access this milestone'));
      }

      // Find the file in milestone deliverables to get storage info
      const fileToDelete = (milestone.deliverables || []).find(f => f.filename === safeFilename);
      if (!fileToDelete) {
        return next(new NotFoundError('File not found in milestone'));
      }

      // Remove file from milestone deliverables
      milestone.deliverables = (milestone.deliverables || []).filter(f => f.filename !== safeFilename);
      await milestone.save();

      // Delete the actual file using file service
      await fileService.deleteFile(fileToDelete);
    } else if (entityType === 'project') {
      const project = await Project.findById(entityId);
      if (!project) {
        return next(new NotFoundError('Project not found'));
      }

      if (project.client.toString() !== userId && project.freelancer.toString() !== userId) {
        return next(new ForbiddenError('Not authorized to access this project'));
      }

      // Find the file in project files to get storage info
      const fileToDelete = (project.files || []).find(f => f.filename === safeFilename);
      if (!fileToDelete) {
        return next(new NotFoundError('File not found in project'));
      }

      // Remove file from project files
      project.files = (project.files || []).filter(f => f.filename !== safeFilename);
      await project.save();

      // Delete the actual file using file service
      await fileService.deleteFile(fileToDelete);
    } else {
      return next(new BadRequestError('Invalid entity type'));
    }

    res.json({
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadMilestoneDeliverable,
  uploadProjectFile,
  downloadFile,
  getMilestoneFiles,
  getProjectFiles,
  deleteFile
};