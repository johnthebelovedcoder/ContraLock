const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const { BadRequestError, UnauthorizedError } = require('../errors/AppError');

class TwoFactorAuthService {
  // Generate a 2FA secret for a user
  async generateSecret(userId) {
    const secret = speakeasy.generateSecret({
      name: `Delivault (${process.env.NODE_ENV !== 'production' ? 'DEV' : 'PROD'})`,
      issuer: 'Delivault',
      length: 32
    });

    // Store the secret in the user's profile
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user with 2FA secret
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false; // Don't enable until verified
    await user.save();

    return {
      secret: secret.base32,
      qrCode: await QRCode.toDataURL(secret.otpauth_url)
    };
  }

  // Verify the 2FA token during setup
  async verifyToken(userId, token) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestError('2FA secret not found for user');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after
    });

    if (verified) {
      // Enable 2FA for the user
      user.twoFactorEnabled = true;
      user.twoFactorVerifiedAt = new Date();
      await user.save();
    }

    return verified;
  }

  // Verify 2FA token for login
  async verifyTokenForLogin(userId, token) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestError('2FA not enabled for this user');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      // Track failed attempts
      if (!user.twoFactorFailedAttempts) {
        user.twoFactorFailedAttempts = 0;
      }
      user.twoFactorFailedAttempts++;
      
      if (user.twoFactorFailedAttempts >= 5) {
        // Lock the account temporarily
        user.twoFactorLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await user.save();
      throw new UnauthorizedError('Invalid 2FA token');
    }

    // Reset failed attempts on successful verification
    user.twoFactorFailedAttempts = 0;
    await user.save();

    return verified;
  }

  // Disable 2FA for a user
  async disableTwoFactor(userId, token) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled) {
      throw new Error('2FA not enabled for this user');
    }

    // Verify the current token to prevent unauthorized disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (verified) {
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      user.twoFactorVerifiedAt = null;
      await user.save();
      return true;
    }

    return false;
  }

  // Generate backup codes for a user
  async generateBackupCodes(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate 10 backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      // Generate a random 10-character code
      const code = Math.random().toString(36).substring(2, 12).toUpperCase();
      backupCodes.push(code);
    }

    user.backupCodes = backupCodes.map(code => ({
      code: code,
      used: false,
      createdAt: new Date()
    }));
    await user.save();

    return backupCodes;
  }

  // Use a backup code
  async useBackupCode(userId, code) {
    const user = await User.findById(userId);
    if (!user || !user.backupCodes || user.backupCodes.length === 0) {
      throw new UnauthorizedError('No backup codes available');
    }

    const codeIndex = user.backupCodes.findIndex(bc => 
      !bc.used && bc.code === code
    );

    if (codeIndex === -1) {
      throw new UnauthorizedError('Invalid or used backup code');
    }

    // Mark the code as used
    user.backupCodes[codeIndex].used = true;
    user.backupCodes[codeIndex].usedAt = new Date();
    await user.save();

    return true;
  }

  // Check if user has 2FA enabled
  hasTwoFactorEnabled(userId) {
    return User.findById(userId).then(user => user?.twoFactorEnabled || false);
  }
}

module.exports = new TwoFactorAuthService();