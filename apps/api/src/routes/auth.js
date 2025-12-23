const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ValidationError
} = require('../errors/AppError');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = require('../middleware/auth');

// Register route
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('firstName').trim().isLength({ min: 1, max: 50 }),
  body('lastName').trim().isLength({ min: 1, max: 50 }),
  body('role').isIn(['client', 'freelancer'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { email, password, firstName, lastName, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user using User.create()
  const user = await User.create({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role,
    status: 'active', // Set as active immediately
    emailVerified: true, // Mark as verified
    profile: {
      completed: false
    }
  });

  // Use user.id or user._id depending on what's available
  const userId = user.id || user._id;
  
  res.status(201).json({
    message: 'User registered successfully.',
    userId
  });
}));

// Login route
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { email, password } = req.body;

  // Find user by email
  console.log('Looking for user with email:', email);
  const user = await User.findOne({ email });
  console.log('User found:', user ? 'Yes' : 'No');
  if (!user) {
    console.log('No user found with email:', email);
    throw new UnauthorizedError('Invalid email or password');
  }


  // Check if account is suspended
  if (user.status === 'suspended') {
    throw new UnauthorizedError('Account suspended. Contact support');
  }

  // Debug: Log the user object structure
  console.log('User object from DB:', JSON.stringify(user, null, 2));
  
  // Get the password hash, checking both direct property and dataValues
  const passwordHash = user.password || (user.dataValues && user.dataValues.password);
  console.log('Password hash from DB:', passwordHash ? 'Exists' : 'Not found');
  console.log('Password hash value:', passwordHash ? passwordHash.substring(0, 20) + '...' : 'N/A');
  console.log('Password being compared (first 10 chars):', password ? password.substring(0, 10) + '...' : 'N/A');
  console.log('Password length:', password ? password.length : 0);
  
  if (!passwordHash) {
    console.error('No password hash found for user:', user.email || user.dataValues?.email);
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Compare password using bcrypt
  const bcrypt = require('bcryptjs');
  console.log('Comparing password...');
  const isPasswordValid = await bcrypt.compare(password, passwordHash);
  console.log('Password comparison result:', isPasswordValid);
  
  if (!isPasswordValid) {
    console.log('Invalid password for user:', user.email || user.dataValues?.email);
    console.log('Expected hash starts with:', passwordHash.substring(0, 20));
    throw new UnauthorizedError('Invalid email or password');
  }
  
  console.log('Password validation successful for user:', user.email || user.dataValues?.email);

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '15m' } // 15 minutes as per your FRD
  );

  const refreshToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
    { expiresIn: '7d' } // 7 days as per your FRD
  );

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      profile: user.profile
    }
  });
}));


// Forgot password route
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    // Return success even if user doesn't exist to prevent email enumeration
    return res.json({ message: 'If an account with this email exists, a password reset link has been sent' });
  }

  // In a real app, you would:
  // 1. Generate a password reset token
  // 2. Save it to the user document with an expiration time
  // 3. Send an email with the reset link
  // For now, we'll just return a success message

  res.json({
    message: 'If an account with this email exists, a password reset link has been sent'
  });
}));

// Reset password route
router.post('/reset-password', [
  body('token').exists(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { token, newPassword } = req.body;

  // In a real app, you would:
  // 1. Verify the password reset token
  // 2. Find the user associated with the token
  // 3. Hash the new password and update the user
  // For now, we'll return a success message

  res.json({ message: 'Password reset successful' });
}));

// Refresh token route (matching frontend expectation)
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret', async (err, user) => {
      if (err) {
        reject(new UnauthorizedError('Invalid refresh token'));
        return;
      }

      try {
        const existingUser = await User.findById(user.userId);
        if (!existingUser) {
          reject(new UnauthorizedError('User no longer exists'));
          return;
        }

        const newAccessToken = jwt.sign(
          { userId: existingUser._id, email: existingUser.email, role: existingUser.role },
          process.env.JWT_SECRET || 'fallback_secret_key',
          { expiresIn: '15m' }
        );

        res.json({ accessToken: newAccessToken });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}));

// Update profile (matching frontend expectation)
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('bio').optional().isLength({ max: 500 }),
  body('location').optional().trim(),
  body('skills').optional().isArray({ max: 15 }),
  body('skills.*').optional().isLength({ max: 50 }),
  body('portfolioLinks').optional().isArray({ max: 5 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const updates = req.body;

  // Only allow updating profile-related fields
  const allowedUpdates = [
    'firstName',
    'lastName',
    'profile.bio',
    'profile.location',
    'profile.skills',
    'profile.portfolioLinks'
  ];

  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update allowed fields
  if (updates.firstName) user.firstName = updates.firstName;
  if (updates.lastName) user.lastName = updates.lastName;
  if (updates.bio) user.profile.bio = updates.bio;
  if (updates.location) user.profile.location = updates.location;
  if (updates.skills) user.profile.skills = updates.skills;
  if (updates.portfolioLinks) user.profile.portfolioLinks = updates.portfolioLinks.map(link => ({ url: link }));

  // Update profile completion status
  if (updates.bio || updates.location || updates.skills) {
    user.profile.completed = true;
  }

  await user.save();

  res.json({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    profile: user.profile
  });
}));

// Change password (matching frontend expectation)
router.post('/change-password', authenticateToken, [
  body('currentPassword').exists(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { currentPassword, newPassword } = req.body;

  // Get the user with password
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if current password is correct
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  user.password = hashedNewPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
}));

// Get current user's information
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // The user ID should be available in req.user from the authenticateToken middleware
    const user = await User.findOne({ _id: req.user.userId });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Return user data (excluding sensitive information like password)
    const userData = {
      id: user._id || user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      profile: user.profile,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json(userData);
  } catch (error) {
    console.error('Error in /auth/me:', error);
    throw error;
  }
}));

module.exports = router;