import { fileService } from '../api/fileService';
import { apiClient } from '../api/client';

// Mock the API client
jest.mock('../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('FileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a single file', async () => {
      const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = {
        message: 'File uploaded successfully',
        file: {
          filename: 'test-123.txt',
          originalName: 'test.txt',
          path: '/uploads/test-123.txt',
          size: 12,
          mimetype: 'text/plain',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await fileService.uploadFile(mockFile);

      expect(apiClient.post).toHaveBeenCalledWith('/files/upload', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should upload a file with additional data', async () => {
      const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain' });
      const additionalData = { projectId: '123', description: 'Test file' };
      const mockResponse = {
        message: 'File uploaded successfully',
        file: {
          filename: 'test-123.txt',
          originalName: 'test.txt',
          path: '/uploads/test-123.txt',
          size: 12,
          mimetype: 'text/plain',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await fileService.uploadFile(mockFile, additionalData);

      expect(apiClient.post).toHaveBeenCalledWith('/files/upload', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should upload multiple files', async () => {
      const mockFiles = [
        new File(['file1 content'], 'file1.txt', { type: 'text/plain' }),
        new File(['file2 content'], 'file2.txt', { type: 'text/plain' }),
      ];
      const mockResponse = {
        message: 'Files processed',
        uploaded: [
          { filename: 'file1-123.txt', originalName: 'file1.txt', size: 13 },
          { filename: 'file2-456.txt', originalName: 'file2.txt', size: 13 },
        ],
        errors: [],
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await fileService.uploadMultipleFiles(mockFiles);

      expect(apiClient.post).toHaveBeenCalledWith('/files/upload-batch', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      const mockBlob = new Blob(['file content'], { type: 'text/plain' });
      const mockResponse = { data: mockBlob };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fileService.downloadFile('test-file.txt');

      expect(apiClient.get).toHaveBeenCalledWith('/files/download/test-file.txt', {
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await fileService.deleteFile('test-file.txt');

      expect(apiClient.delete).toHaveBeenCalledWith('/files/delete/test-file.txt');
    });
  });

  describe('uploadMilestoneDeliverables', () => {
    it('should upload milestone deliverables', async () => {
      const mockFiles = [
        new File(['content'], 'deliverable.pdf', { type: 'application/pdf' }),
      ];
      const mockResponse = {
        message: 'Deliverables uploaded successfully',
        uploaded: [{ filename: 'deliverable-123.pdf', originalName: 'deliverable.pdf' }],
        errors: [],
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await fileService.uploadMilestoneDeliverables('project123', 'milestone456', mockFiles);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/files/upload-milestone/project123/milestone456',
        expect.any(FormData),
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});