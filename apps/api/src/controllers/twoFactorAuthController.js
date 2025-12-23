const twoFactorAuthService = require('../services/twoFactorAuthService');
const { BadRequestError, UnauthorizedError } = require('../errors/AppError');

// Generate 2FA secret and QR code
const generateSecret = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await twoFactorAuthService.generateSecret(userId);

    res.json({
      secret: result.secret,
      qrCode: result.qrCode,
      message: '2FA secret generated. Verify with token to enable.'
    });
  } catch (error) {
    next(error);
  }
};

// Verify 2FA token during setup
const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    if (!token) {
      return next(new BadRequestError('Token is required'));
    }

    const verified = await twoFactorAuthService.verifyToken(userId, token);

    if (verified) {
      res.json({
        success: true,
        message: '2FA enabled successfully'
      });
    } else {
      return next(new BadRequestError('Invalid token'));
    }
  } catch (error) {
    next(error);
  }
};

// Verify 2FA token for login (external use)
const verifyTokenForLogin = async (req, res, next) => {
  try {
    const { userId, token } = req.body;

    if (!token) {
      return next(new BadRequestError('Token is required'));
    }

    const verified = await twoFactorAuthService.verifyTokenForLogin(userId, token);

    if (verified) {
      res.json({
        success: true,
        message: '2FA verified successfully'
      });
    } else {
      return next(new UnauthorizedError('Invalid 2FA token'));
    }
  } catch (error) {
    next(error);
  }
};

// Disable 2FA
const disableTwoFactor = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    if (!token) {
      return next(new BadRequestError('Token is required'));
    }

    const success = await twoFactorAuthService.disableTwoFactor(userId, token);

    if (success) {
      res.json({
        success: true,
        message: '2FA disabled successfully'
      });
    } else {
      return next(new BadRequestError('Invalid token'));
    }
  } catch (error) {
    next(error);
  }
};

// Generate backup codes
const generateBackupCodes = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const backupCodes = await twoFactorAuthService.generateBackupCodes(userId);

    res.json({
      backupCodes,
      message: 'Backup codes generated. Store them securely.'
    });
  } catch (error) {
    next(error);
  }
};

// Use backup code
const useBackupCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    if (!code) {
      return next(new BadRequestError('Backup code is required'));
    }

    const success = await twoFactorAuthService.useBackupCode(userId, code);

    if (success) {
      res.json({
        success: true,
        message: 'Backup code verified and used successfully'
      });
    } else {
      return next(new UnauthorizedError('Invalid backup code'));
    }
  } catch (error) {
    next(error);
  }
};

// Check if 2FA is enabled for user
const checkTwoFactorStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const isEnabled = await twoFactorAuthService.hasTwoFactorEnabled(userId);

    res.json({
      twoFactorEnabled: isEnabled
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSecret,
  verifyToken,
  verifyTokenForLogin,
  disableTwoFactor,
  generateBackupCodes,
  useBackupCode,
  checkTwoFactorStatus
};