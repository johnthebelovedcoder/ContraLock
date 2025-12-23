import { apiClient } from './client';

export interface UploadResponse {
  message: string;
  file: FileMetadata;
}

export interface FileMetadata {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  integrity: {
    isValid: boolean;
    hash: string;
    size: number;
    originalName: string;
    path: string;
  };
  uploadedAt: string;
  url: string;
}

export interface MultipleUploadResponse {
  message: string;
  uploaded: FileMetadata[];
  errors: Array<{
    filename: string;
    error: string;
  }>;
}

class FileService {
  async uploadFile(file: File, additionalData?: Record<string, any>): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional data as needed
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  async uploadMultipleFiles(files: File[]): Promise<MultipleUploadResponse> {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const response = await apiClient.post('/files/upload-batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  async downloadFile(filename: string): Promise<Blob> {
    const response = await apiClient.get(`/files/download/${filename}`, {
      responseType: 'blob',
    });
    
    return response.data;
  }

  async deleteFile(filename: string): Promise<void> {
    await apiClient.delete(`/files/delete/${filename}`);
  }

  async uploadMilestoneDeliverables(
    projectId: string, 
    milestoneId: string, 
    files: File[]
  ): Promise<MultipleUploadResponse> {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('deliverables', files[i]);
    }

    const response = await apiClient.post(
      `/files/upload-milestone/${projectId}/${milestoneId}`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  }
}

export const fileService = new FileService();