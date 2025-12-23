const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const {
  generateSecret,
  verifyToken,
  verifyTokenForLogin,
  disableTwoFactor,
  generateBackupCodes,
  useBackupCode,
  checkTwoFactorStatus
} = require('../controllers/twoFactorAuthController');

const router = express.Router();

// Generate 2FA secret and QR code
router.post('/generate-secret', authenticateToken, generateSecret);

// Verify 2FA token during setup
router.post('/verify', authenticateToken, [
  body('token').trim().isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await verifyToken(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Verify 2FA token for login (used internally by auth system)
router.post('/verify-login', [
  body('userId').isMongoId(),
  body('token').trim().isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await verifyTokenForLogin(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Disable 2FA
router.post('/disable', authenticateToken, [
  body('token').trim().isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await disableTwoFactor(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Generate backup codes
router.post('/backup-codes', authenticateToken, generateBackupCodes);

// Use backup code
router.post('/use-backup-code', authenticateToken, [
  body('code').trim().isLength({ min: 10, max: 10 }).withMessage('Backup code must be 10 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await useBackupCode(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Check 2FA status
router.get('/status', authenticateToken, checkTwoFactorStatus);

module.exports = router;