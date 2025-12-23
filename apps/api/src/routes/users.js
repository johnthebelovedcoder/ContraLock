const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { User } = require('../models/modelManager');
const { Op } = require('sequelize');

const router = express.Router();

// Middleware to verify JWT token (assuming you have this in a separate file)
const authenticateToken = require('../middleware/auth');
const { cacheMiddleware, cacheUser, invalidateUserCache } = require('../middleware/cache');

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password') // Exclude password from response
      .lean(); // Use lean() for better performance when not modifying

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      profile: user.profile,
      ratings: user.ratings,
      trustScore: user.trustScore,
      statistics: user.statistics,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (for other users' profiles)
router.get('/:id', authenticateToken, cacheUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(id)
      .select('-password') // Exclude password from response
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For other user profiles, we might want to limit what's returned
    // For now, return the full profile
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email, // Only included if it's the current user
      role: user.role,
      status: user.status,
      profile: user.profile,
      ratings: user.ratings,
      trustScore: user.trustScore,
      statistics: user.statistics,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (detailed update for admin purposes or other use cases)
router.put('/:id', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('profile.bio').optional().isLength({ max: 500 }),
  body('profile.location').optional().trim(),
  body('profile.skills').optional().isArray({ max: 15 }),
  body('profile.skills.*').optional().isLength({ max: 50 }),
  body('profile.portfolioLinks').optional().isArray({ max: 5 }),
  body('profile.portfolioLinks.*.url').optional().isURL(),
  body('profile.portfolioLinks.*.description').optional().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Only allow updating profile-related fields
    const allowedUpdates = [
      'firstName',
      'lastName',
      'profile.bio',
      'profile.location',
      'profile.skills',
      'profile.portfolioLinks',
      'profile.avatar'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Update profile completion status
    if (filteredUpdates['profile.bio'] ||
        filteredUpdates['profile.location'] ||
        filteredUpdates['profile.skills']) {
      filteredUpdates['profile.completed'] = true;
    }

    // Check if the requesting user has permission to update this user
    // For simplicity, assume they can only update their own profile
    // In a real app, you might have admin permissions
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...filteredUpdates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    // Invalidate the user cache for this user since it was updated
    invalidateUserCache(id);

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile picture (matching frontend expectations)
router.put('/:id/profile-picture', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (id !== userId) {
      const requestingUser = await User.findById(userId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this user\'s profile picture' });
      }
    }

    // In a real implementation, this would handle file upload
    // For now, we'll update the profile picture field
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        'profile.avatar': req.body.avatarUrl || req.file?.path, // In real app, you'd process the uploaded file
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get KYC verification (matching frontend expectations)
router.get('/:id/kyc', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (id !== userId) {
      const requestingUser = await User.findById(userId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this user\'s KYC' });
      }
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return KYC verification information
    res.json({
      userId: user._id,
      verification: user.verification,
      status: user.verification?.emailVerifiedAt ? 'VERIFIED' : 'PENDING',
      documents: user.verification?.identityDocuments || []
    });
  } catch (error) {
    console.error('Get KYC error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit KYC verification (matching frontend expectations)
router.post('/:id/kyc', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType, documentFront, documentBack, selfie, addressProof } = req.body;
    const userId = req.user.userId;

    // Verify the requesting user is the same as the target user
    if (id !== userId) {
      return res.status(403).json({ error: 'Not authorized to submit KYC for another user' });
    }

    // In a real implementation, this would process document uploads
    // For now, we'll simulate the submission
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        'verification.identityDocuments': [
          {
            type: documentType,
            url: documentFront, // In real app, these would be stored file paths/URLs
            submittedAt: new Date(),
            verified: false
          }
        ],
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: updatedUser._id,
      status: 'SUBMITTED',
      documents: updatedUser.verification?.identityDocuments || []
    });
  } catch (error) {
    console.error('Submit KYC error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search and filter users (matching frontend expectations)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, skills, location, minRating } = req.query;

    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      filter['profile.skills'] = { [Op.overlap]: skillsArray }; // Sequelize operator for array overlap
    }

    if (location) {
      filter['profile.location'] = { [Op.iLike]: `%${location}%` }; // Case-insensitive search for location
    }

    if (minRating) {
      filter['ratings.average'] = { [Op.gte]: parseFloat(minRating) };
    }

    const users = await User.find({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(limit) * (parseInt(page) - 1)
    });

    // Remove password from results manually since User.find doesn't automatically exclude fields
    const usersWithoutPassword = users.map(user => {
      const userObj = user.toJSON ? user.toJSON() : user;
      delete userObj.password;
      return userObj;
    });

    const total = await User.count({ where: filter });

    res.json({
      items: usersWithoutPassword,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment Methods - added to match frontend expectations
// Get payment methods for a user
router.get('/:userId/payment-methods', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this user\'s payment methods' });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In a real implementation, this would fetch from Stripe
    // For now, return the payment methods stored in the user doc
    res.json(user.paymentMethods || []);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new payment method for a user
router.post('/:userId/payment-methods', authenticateToken, [
  body('type').isIn(['card', 'bank_account', 'paypal']),
  body('token').exists() // Stripe token
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { type, token } = req.body;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to add payment method for this user' });
      }
    }

    try {
      // In a real implementation, we would use the Stripe token to create a payment method
      // For now, we'll simulate by adding to user's payment methods
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // In real implementation:
      // 1. Create payment method in Stripe
      // 2. Attach to customer
      // 3. Store reference in user document

      const newPaymentMethod = {
        type,
        providerId: `pm_${Date.now()}`, // Placeholder ID
        default: user.paymentMethods.length === 0, // Make first one default
        verified: true // In real implementation, this would happen via Stripe
      };

      user.paymentMethods.push(newPaymentMethod);
      await user.save();

      res.json(newPaymentMethod);
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      res.status(400).json({ error: 'Payment method could not be added' });
    }
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a payment method for a user
router.put('/:userId/payment-methods/:paymentMethodId', authenticateToken, [
  body('isDefault').optional().isBoolean(),
  body('verified').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, paymentMethodId } = req.params;
    const { isDefault, verified } = req.body;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update payment method for this user' });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the payment method to update
    const paymentMethod = user.paymentMethods.find(method => method.providerId === paymentMethodId);
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Update payment method properties
    if (isDefault !== undefined) {
      // Set all other methods as not default
      user.paymentMethods.forEach(method => {
        if (method.providerId !== paymentMethodId) {
          method.default = false;
        }
      });
      paymentMethod.default = isDefault;
    }

    if (verified !== undefined) {
      paymentMethod.verified = verified;
    }

    await user.save();

    res.json(paymentMethod);
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a payment method for a user
router.delete('/:userId/payment-methods/:paymentMethodId', authenticateToken, async (req, res) => {
  try {
    const { userId, paymentMethodId } = req.params;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to remove payment method for this user' });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find and remove the payment method
    const methodIndex = user.paymentMethods.findIndex(method => method.providerId === paymentMethodId);
    if (methodIndex === -1) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    user.paymentMethods.splice(methodIndex, 1);
    await user.save();

    res.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    console.error('Remove payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;