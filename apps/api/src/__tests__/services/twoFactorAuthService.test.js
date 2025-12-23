const TwoFactorAuthService = require('../../services/twoFactorAuthService');
const { User } = require('../../models/modelManager');

// Mock the external dependencies
jest.mock('../../models/modelManager');
jest.mock('speakeasy');
jest.mock('qrcode');

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

describe('TwoFactorAuthService', () => {
  let mockUserModel, mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      twoFactorSecret: null,
      twoFactorEnabled: false,
      twoFactorVerifiedAt: null,
      twoFactorFailedAttempts: 0,
      backupCodes: [],
      save: jest.fn()
    };

    mockUserModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn()
    };

    User.findById = mockUserModel.findById;
    User.findOne = mockUserModel.findOne;
    User.create = mockUserModel.create;
  });

  describe('generateSecret', () => {
    it('should generate a 2FA secret and QR code for user', async () => {
      // Arrange
      const userId = 'user123';
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/...'
      };
      
      speakeasy.generateSecret.mockReturnValue(mockSecret);
      QRCode.toDataURL.mockResolvedValue('mock-qr-data-url');
      mockUserModel.findById.mockResolvedValue(mockUser);

      // Act
      const result = await TwoFactorAuthService.generateSecret(userId);

      // Assert
      expect(result).toEqual({
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'mock-qr-data-url'
      });
      expect(mockUser.twoFactorSecret).toBe('JBSWY3DPEHPK3PXP');
      expect(mockUser.twoFactorEnabled).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'nonexistent-user';
      mockUserModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(TwoFactorAuthService.generateSecret(userId))
        .rejects.toThrow('User not found');
    });
  });

  describe('verifyToken', () => {
    it('should verify token and enable 2FA', async () => {
      // Arrange
      const userId = 'user123';
      const token = '123456';
      speakeasy.totp.verify.mockReturnValue(true);
      
      const userWithSecret = { ...mockUser };
      userWithSecret.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      mockUserModel.findById.mockResolvedValue(userWithSecret);

      // Act
      const result = await TwoFactorAuthService.verifyToken(userId, token);

      // Assert
      expect(result).toBe(true);
      expect(mockUser.twoFactorEnabled).toBe(true);
      expect(mockUser.twoFactorVerifiedAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        token,
        window: 2
      });
    });

    it('should return false if token is invalid', async () => {
      // Arrange
      const userId = 'user123';
      const token = 'invalid-token';
      speakeasy.totp.verify.mockReturnValue(false);
      
      const userWithSecret = { ...mockUser };
      userWithSecret.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      mockUserModel.findById.mockResolvedValue(userWithSecret);

      // Act
      const result = await TwoFactorAuthService.verifyToken(userId, token);

      // Assert
      expect(result).toBe(false);
      expect(mockUser.twoFactorEnabled).toBe(false); // Should not be enabled
    });

    it('should throw error if user has no 2FA secret', async () => {
      // Arrange
      const userId = 'user123';
      const token = '123456';
      mockUserModel.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(TwoFactorAuthService.verifyToken(userId, token))
        .rejects.toThrow('2FA secret not found for user');
    });
  });

  describe('verifyTokenForLogin', () => {
    it('should verify token for login successfully', async () => {
      // Arrange
      const userId = 'user123';
      const token = '123456';
      speakeasy.totp.verify.mockReturnValue(true);
      
      const userWithSecret = { ...mockUser };
      userWithSecret.twoFactorEnabled = true;
      userWithSecret.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      mockUserModel.findById.mockResolvedValue(userWithSecret);

      // Act
      const result = await TwoFactorAuthService.verifyTokenForLogin(userId, token);

      // Assert
      expect(result).toBe(true);
      expect(mockUser.twoFactorFailedAttempts).toBe(0); // Reset failed attempts
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should increment failed attempts on invalid token', async () => {
      // Arrange
      const userId = 'user123';
      const token = 'wrong-token';
      speakeasy.totp.verify.mockReturnValue(false);
      
      const userWithSecret = { ...mockUser };
      userWithSecret.twoFactorEnabled = true;
      userWithSecret.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      mockUserModel.findById.mockResolvedValue(userWithSecret);

      // Act & Assert
      await expect(TwoFactorAuthService.verifyTokenForLogin(userId, token))
        .rejects.toThrow('Invalid 2FA token');
      expect(mockUser.twoFactorFailedAttempts).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should lock account after too many failed attempts', async () => {
      // Arrange
      const userId = 'user123';
      const token = 'wrong-token';
      speakeasy.totp.verify.mockReturnValue(false);
      
      const userWithSecret = { ...mockUser };
      userWithSecret.twoFactorEnabled = true;
      userWithSecret.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      userWithSecret.twoFactorFailedAttempts = 4; // Near limit
      mockUserModel.findById.mockResolvedValue(userWithSecret);

      // Act & Assert
      await expect(TwoFactorAuthService.verifyTokenForLogin(userId, token))
        .rejects.toThrow('Invalid 2FA token');
      expect(mockUser.twoFactorFailedAttempts).toBe(5); // Now at limit
      expect(mockUser.twoFactorLockedUntil).toBeDefined(); // Should be locked
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('disableTwoFactor', () => {
    it('should disable 2FA with valid token', async () => {
      // Arrange
      const userId = 'user123';
      const token = '123456';
      speakeasy.totp.verify.mockReturnValue(true);
      
      const userWithSecret = { ...mockUser };
      userWithSecret.twoFactorEnabled = true;
      userWithSecret.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      mockUserModel.findById.mockResolvedValue(userWithSecret);

      // Act
      const result = await TwoFactorAuthService.disableTwoFactor(userId, token);

      // Assert
      expect(result).toBe(true);
      expect(mockUser.twoFactorEnabled).toBe(false);
      expect(mockUser.twoFactorSecret).toBeNull();
      expect(mockUser.twoFactorVerifiedAt).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return false if token is invalid', async () => {
      // Arrange
      const userId = 'user123';
      const token = 'wrong-token';
      speakeasy.totp.verify.mockReturnValue(false);
      
      const userWithSecret = { ...mockUser };
      userWithSecret.twoFactorEnabled = true;
      userWithSecret.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      mockUserModel.findById.mockResolvedValue(userWithSecret);

      // Act
      const result = await TwoFactorAuthService.disableTwoFactor(userId, token);

      // Assert
      expect(result).toBe(false);
      expect(mockUser.twoFactorEnabled).toBe(true); // Should remain enabled
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate new backup codes for user', async () => {
      // Arrange
      const userId = 'user123';
      const mockCodes = [
        'ABCD-EFGH-IJKL-MNOP',
        'QRST-UVWX-YZ12-3456',
        '7890-ABCD-EFGH-IJKL'
      ];
      jest.spyOn(Math, 'random').mockReturnValue(0.123456789); // Mock random for predictable tests
      
      mockUserModel.findById.mockResolvedValue(mockUser);

      // Act
      const result = await TwoFactorAuthService.generateBackupCodes(userId);

      // Assert
      expect(result).toHaveLength(10); // Should generate 10 codes
      expect(mockUser.backupCodes).toHaveLength(10); // Should store 10 codes
      expect(mockUser.backupCodes[0]).toHaveProperty('code');
      expect(mockUser.backupCodes[0]).toHaveProperty('used', false);
      expect(mockUser.backupCodes[0]).toHaveProperty('createdAt');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'nonexistent-user';
      mockUserModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(TwoFactorAuthService.generateBackupCodes(userId))
        .rejects.toThrow('User not found');
    });
  });
});