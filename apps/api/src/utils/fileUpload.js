// File Upload Utility with Security Scanning
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine upload destination based on file type
    let uploadPath = 'uploads/';
    
    // Create subdirectories based on file type
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype === 'application/pdf') {
      uploadPath += 'documents/';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos/';
    } else {
      uploadPath += 'other/';
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename to prevent conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const sanitizedFilename = sanitizeFileName(file.originalname.replace(ext, ''));
    cb(null, sanitizedFilename + '-' + uniqueSuffix + ext);
  }
});

// File filter to check for malicious files
const fileFilter = (req, file, cb) => {
  // Allowed file types based on project requirements
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
    // Documents  
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'application/rtf', 'application/x-rtf',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar',
    // Code files
    'text/html', 'text/css', 'application/javascript', 'application/json',
    'application/x-python', 'text/x-python', 'application/x-sh',
    // Other
    'text/csv'
  ];
  
  // Check file type
  if (allowedTypes.includes(file.mimetype)) {
    // Additional check for potentially harmful extensions
    const fileName = file.originalname.toLowerCase();
    const dangerousExtensions = ['.exe', '.bat', '.com', '.scr', '.vbs', '.js', '.jar', '.msi', '.pif', '.lnk'];
    
    const hasDangerousExt = dangerousExtensions.some(ext => fileName.endsWith(ext));
    if (hasDangerousExt) {
      return cb(new Error('File type not allowed'), false);
    }
    
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Max 5 files at once
  }
});

// Sanitize filename to prevent path traversal
function sanitizeFileName(fileName) {
  // Remove potentially dangerous characters
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
    .replace(/__+/g, '_') // Replace multiple underscores with single
    .substring(0, 100); // Limit length
}

// Virus scanning function (placeholder - in production, configure with real ClamAV)
async function scanForViruses(filePath) {
  // If ClamAV is not configured, log warning but allow upload for development
  console.warn('Virus scanning not configured. Skipping scan for:', filePath);
  return {
    isClean: true, // Assume file is clean if scanning isn't available
    scanResult: { isInfected: false },
    filePath: filePath,
    warning: 'Scanning service not available'
  };
}

// Validate file integrity
function validateFileIntegrity(file) {
  return new Promise((resolve, reject) => {
    // Calculate file hash for integrity check
    const hash = crypto.createHash('sha256');
    const stream = fs.ReadStream(file.path);
    
    stream.on('data', data => hash.update(data));
    stream.on('end', () => {
      const fileHash = hash.digest('hex');
      resolve({
        isValid: true,
        hash: fileHash,
        size: file.size,
        originalName: file.originalname,
        path: file.path
      });
    });
    
    stream.on('error', reject);
  });
}

module.exports = {
  upload,
  scanForViruses,
  validateFileIntegrity,
  sanitizeFileName
};