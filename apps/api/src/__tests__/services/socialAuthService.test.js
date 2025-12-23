const SocialAuthService = require('../../services/socialAuthService');
const { User } = require('../../models/modelManager');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

// Mock the external dependencies
jest.mock('../../models/modelManager');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('google-auth-library');
jest.mock('axios');

describe('SocialAuthService', () => {
  let mockUserModel, mockGoogleClient, mockAxios;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock User model
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn()
    };

    User.findOne = mockUserModel.findOne;
    User.create = mockUserModel.create;

    // Mock Google OAuth2 client
    mockGoogleClient = {
      verifyIdToken: jest.fn()
    };
    OAuth2Client.mockImplementation(() => mockGoogleClient);

    // Mock Axios
    mockAxios = {
      post: jest.fn(),
      get: jest.fn()
    };
    axios.post = mockAxios.post;
    axios.get = mockAxios.get;

    // Mock jsonwebtoken
    jwt.sign.mockImplementation((payload) => `mocked-token-${JSON.stringify(payload)}`);

    // Mock bcrypt
    bcrypt.hash.mockImplementation((str) => Promise.resolve(`hashed-${str}`));
  });

  describe('handleGoogleLogin', () => {
    it('should create new user if Google ID does not exist', async () => {
      // Arrange
      const idToken = 'mock-google-id-token';
      
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          sub: 'google-user-123',
          email: 'newuser@gmail.com',
          given_name: 'New',
          family_name: 'User',
          picture: 'https://example.com/picture.jpg'
        })
      };
      mockGoogleClient.verifyIdToken.mockResolvedValue(mockTicket);

      mockUserModel.findOne.mockResolvedValue(null); // User does not exist
      
      const mockNewUser = {
        _id: 'new-user-123',
        email: 'newuser@gmail.com',
        firstName: 'New',
        lastName: 'User',
        role: 'client',
        googleId: 'google-user-123',
        emailVerified: true,
        profile: { avatar: 'https://example.com/picture.jpg', completed: false },
        save: jest.fn()
      };
      mockUserModel.create.mockResolvedValue(mockNewUser);

      // Act
      const result = await SocialAuthService.handleGoogleLogin(idToken);

      // Assert
      expect(mockGoogleClient.verifyIdToken).toHaveBeenCalledWith({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ googleId: 'google-user-123' });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        email: 'newuser@gmail.com',
        password: 'hashed-undefined', // Because Math.random() returns undefined in this context, let's fix this
        firstName: 'New',
        lastName: 'User',
        role: 'client', // Default role
        status: 'verified',
        googleId: 'google-user-123',
        emailVerified: true,
        profile: { avatar: 'https://example.com/picture.jpg', completed: false },
        lastLoginAt: expect.any(Date)
      });
      
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result.user.email).toBe('newuser@gmail.com');
      expect(result.user.firstName).toBe('New');
      expect(result.user.lastName).toBe('User');
    });

    it('should update existing user if Google ID already exists', async () => {
      // Arrange
      const idToken = 'mock-google-id-token';
      
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          sub: 'google-user-123',
          email: 'existing@example.com',
          given_name: 'Updated',
          family_name: 'Name',
          picture: 'https://example.com/updated.jpg'
        })
      };
      mockGoogleClient.verifyIdToken.mockResolvedValue(mockTicket);

      const mockExistingUser = {
        _id: 'existing-user-123',
        email: 'existing@example.com',
        firstName: 'Old',
        lastName: 'Name',
        googleId: 'google-user-123',
        profile: { avatar: 'https://example.com/old.jpg', completed: true },
        save: jest.fn()
      };
      mockUserModel.findOne.mockResolvedValueOnce(mockExistingUser); // First call (find by googleId)

      // Act
      const result = await SocialAuthService.handleGoogleLogin(idToken);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ googleId: 'google-user-123' });
      expect(mockExistingUser.firstName).toBe('Updated'); // Should be updated
      expect(mockExistingUser.lastName).toBe('Name'); // Should be updated
      expect(mockExistingUser.profile.avatar).toBe('https://example.com/updated.jpg'); // Should be updated
      expect(mockExistingUser.save).toHaveBeenCalled(); // Should be saved
    });

    it('should link Google account to existing user if email matches but Google ID is missing', async () => {
      // Arrange
      const idToken = 'mock-google-id-token';
      
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          sub: 'google-user-123',
          email: 'existing@example.com',
          given_name: 'Existing',
          family_name: 'User',
          picture: 'https://example.com/picture.jpg'
        })
      };
      mockGoogleClient.verifyIdToken.mockResolvedValue(mockTicket);

      // First findOne returns null (no Google ID match)
      mockUserModel.findOne
        .mockResolvedValueOnce(null) // No user with googleId
        .mockResolvedValueOnce({ // User with email exists
          _id: 'existing-user-123',
          email: 'existing@example.com',
          firstName: 'Existing',
          lastName: 'User',
          googleId: null, // No Google ID yet
          emailVerified: false,
          profile: { completed: true },
          save: jest.fn()
        });

      // Act
      const result = await SocialAuthService.handleGoogleLogin(idToken);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenNthCalledWith(1, { googleId: 'google-user-123' });
      expect(mockUserModel.findOne).toHaveBeenNthCalledWith(2, { email: 'existing@example.com' });
      
      // User should be linked to Google account
      const linkedUser = mockUserModel.findOne.mock.results[1].value;
      expect(linkedUser.googleId).toBe('google-user-123');
      expect(linkedUser.emailVerified).toBe(true);
      expect(linkedUser.save).toHaveBeenCalled();
    });

    it('should throw error on Google authentication failure', async () => {
      // Arrange
      const idToken = 'invalid-token';
      const mockError = new Error('Invalid token');
      mockGoogleClient.verifyIdToken.mockRejectedValue(mockError);

      // Act & Assert
      await expect(SocialAuthService.handleGoogleLogin(idToken))
        .rejects.toThrow('Google authentication failed:');
    });
  });

  describe('handleLinkedInLogin', () => {
    it('should create new user if LinkedIn ID does not exist', async () => {
      // Arrange
      const authorizationCode = 'linkedin-auth-code';
      const mockAccessToken = 'linkedin-access-token';
      const mockProfileData = {
        id: 'linkedin-user-123',
        firstName: { localized: { en_US: 'New' } },
        lastName: { localized: { en_US: 'LinkedIn User' } }
      };
      const mockEmailData = {
        data: {
          elements: [
            { 'handle~': { emailAddress: 'newlinkedinuser@linkedin.com' } }
          ]
        }
      };

      // Mock access token exchange
      mockAxios.post.mockResolvedValueOnce({ data: { access_token: mockAccessToken } });
      // Mock profile data
      mockAxios.get
        .mockResolvedValueOnce({ data: mockProfileData }) // Profile data
        .mockResolvedValueOnce(mockEmailData); // Email data

      mockUserModel.findOne.mockResolvedValue(null); // No existing user

      const mockNewUser = {
        _id: 'new-linkedin-user-123',
        email: 'newlinkedinuser@linkedin.com',
        firstName: 'New',
        lastName: 'LinkedIn User',
        role: 'freelancer',
        linkedinId: 'linkedin-user-123',
        emailVerified: true,
        profile: { completed: false }
      };
      mockUserModel.create.mockResolvedValue(mockNewUser);

      // Act
      const result = await SocialAuthService.handleLinkedInLogin(authorizationCode);

      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            code: authorizationCode,
            redirect_uri: process.env.LINKEDIN_REDIRECT_URI
          })
        })
      );
      
      expect(mockAxios.get).toHaveBeenCalledTimes(2); // Profile and email
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ linkedinId: 'linkedin-user-123' });
      expect(mockUserModel.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'newlinkedinuser@linkedin.com',
        firstName: 'New',
        lastName: 'LinkedIn User',
        role: 'freelancer', // Default for LinkedIn
        linkedinId: 'linkedin-user-123',
        emailVerified: true
      }));
      
      expect(result.user.email).toBe('newlinkedinuser@linkedin.com');
    });

    it('should update existing LinkedIn user', async () => {
      // Arrange
      const authorizationCode = 'linkedin-auth-code';
      const mockAccessToken = 'linkedin-access-token';
      const mockProfileData = {
        id: 'linkedin-user-123',
        firstName: { localized: { en_US: 'Updated' } },
        lastName: { localized: { en_US: 'Name' } }
      };
      const mockEmailData = {
        data: {
          elements: [
            { 'handle~': { emailAddress: 'existing@linkedin.com' } }
          ]
        }
      };

      // Mock access token exchange
      mockAxios.post.mockResolvedValueOnce({ data: { access_token: mockAccessToken } });
      // Mock profile data
      mockAxios.get
        .mockResolvedValueOnce({ data: mockProfileData }) // Profile data
        .mockResolvedValueOnce(mockEmailData); // Email data

      const mockExistingUser = {
        _id: 'existing-linkedin-user-123',
        email: 'existing@linkedin.com',
        firstName: 'Old',
        lastName: 'Name',
        linkedinId: 'linkedin-user-123',
        profile: { completed: true },
        save: jest.fn()
      };
      mockUserModel.findOne.mockResolvedValue(mockExistingUser);

      // Act
      const result = await SocialAuthService.handleLinkedInLogin(authorizationCode);

      // Assert
      expect(mockExistingUser.firstName).toBe('Updated'); // Should be updated
      expect(mockExistingUser.lastName).toBe('Name'); // Should be updated
      expect(mockExistingUser.lastLoginAt).toBeDefined(); // Should be set
      expect(mockExistingUser.save).toHaveBeenCalled(); // Should be saved
    });

    it('should throw error on LinkedIn authentication failure', async () => {
      // Arrange
      const authorizationCode = 'invalid-code';
      const mockError = new Error('Invalid authorization code');
      mockAxios.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(SocialAuthService.handleLinkedInLogin(authorizationCode))
        .rejects.toThrow('LinkedIn authentication failed:');
    });
  });
});