const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk'); // For S3 integration

class FileService {
  constructor() {
    // Configuration - can be switched based on environment
    this.storageType = process.env.FILE_STORAGE_TYPE || 'local'; // 'local', 's3', 'cloudinary'
    this.uploadDir = process.env.FILE_UPLOAD_DIR || path.join(__dirname, '..', '..', '..', 'uploads');
    
    if (this.storageType === 's3') {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      this.bucketName = process.env.S3_BUCKET_NAME;
    }
    
    // Create upload directory if it doesn't exist
    if (this.storageType === 'local' && !fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // Generate safe filename
  generateFilename(originalName) {
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    return `${base}-${Date.now()}-${uuidv4()}${ext}`;
  }

  // Validate file type
  validateFileType(mimetype, allowedTypes = []) {
    if (allowedTypes.length === 0) {
      // Default allowed types
      allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'application/zip', 'application/x-rar-compressed'
      ];
    }
    return allowedTypes.includes(mimetype);
  }

  // Validate file size
  validateFileSize(size, maxSize = 10 * 1024 * 1024) { // 10MB default
    return size <= maxSize;
  }

  // Upload file - can handle both local and cloud storage
  async uploadFile(file, options = {}) {
    const {
      allowedTypes = [],
      maxSize = 10 * 1024 * 1024, // 10MB
      folder = 'general'
    } = options;

    // Validate file
    if (!this.validateFileType(file.mimetype, allowedTypes)) {
      throw new Error('Invalid file type');
    }

    if (!this.validateFileSize(file.size, maxSize)) {
      throw new Error('File size too large');
    }

    // Generate safe filename
    const filename = this.generateFilename(file.originalname);
    const relativePath = path.join(folder, filename);
    const absolutePath = path.join(this.uploadDir, relativePath);

    try {
      if (this.storageType === 'local') {
        // Ensure directory exists
        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Move uploaded file to destination
        await this.moveFile(file.path, absolutePath);

        return {
          filename,
          originalName: file.originalname,
          path: relativePath, // relative to upload dir
          absolutePath,
          size: file.size,
          mimetype: file.mimetype,
          storageType: 'local',
          publicUrl: `/api/files/download/${filename}` // This will be handled by the download route
        };
      } else if (this.storageType === 's3') {
        // Upload to S3
        const fileContent = fs.readFileSync(file.path);
        
        const params = {
          Bucket: this.bucketName,
          Key: relativePath,
          Body: fileContent,
          ContentType: file.mimetype,
          Metadata: {
            originalname: file.originalname,
            size: file.size.toString()
          }
        };

        const result = await this.s3.upload(params).promise();

        return {
          filename,
          originalName: file.originalname,
          path: relativePath,
          size: file.size,
          mimetype: file.mimetype,
          storageType: 's3',
          publicUrl: result.Location
        };
      }
    } catch (error) {
      // Clean up temporary file if upload fails
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
      throw error;
    }
  }

  // Move file helper
  moveFile(source, destination) {
    return new Promise((resolve, reject) => {
      fs.rename(source, destination, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Delete file
  async deleteFile(fileInfo) {
    try {
      if (fileInfo.storageType === 'local') {
        const absolutePath = path.join(this.uploadDir, fileInfo.path);
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }
      } else if (fileInfo.storageType === 's3') {
        const params = {
          Bucket: this.bucketName,
          Key: fileInfo.path
        };
        await this.s3.deleteObject(params).promise();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Get file URL (for local files, this would be relative to the download route)
  getFileUrl(fileInfo) {
    if (fileInfo.storageType === 's3') {
      return fileInfo.publicUrl;
    } else {
      // For local files, return the download route
      return `/api/files/download/${fileInfo.filename}`;
    }
  }

  // Get file info for a filename
  async getFileInfo(filename) {
    const relativePath = filename;
    const absolutePath = path.join(this.uploadDir, relativePath);
    
    if (this.storageType === 'local' && fs.existsSync(absolutePath)) {
      const stats = fs.statSync(absolutePath);
      return {
        filename: path.basename(relativePath),
        path: relativePath,
        size: stats.size,
        storageType: 'local',
        uploadedAt: stats.birthtime
      };
    }
    
    // For S3, we would need to fetch from the object metadata
    return null;
  }
}

module.exports = new FileService();