const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  googleLogin,
  linkedinLogin,
  getSocialLoginUrls,
  googleCallback,
  linkedinCallback
} = require('../controllers/socialAuthController');

const router = express.Router();

// Google login - direct token exchange (for client-side OAuth)
router.post('/google', [
  body('idToken').trim().notEmpty().withMessage('Google ID token is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await googleLogin(req, res, next);
  } catch (error) {
    next(error);
  }
});

// LinkedIn login - direct code exchange (for client-side OAuth)
router.post('/linkedin', [
  body('code').trim().notEmpty().withMessage('Authorization code is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await linkedinLogin(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Google OAuth callback endpoint
router.get('/google/callback', googleCallback);

// LinkedIn OAuth callback endpoint
router.get('/linkedin/callback', linkedinCallback);

// Get social login URLs (for client-side redirect)
router.get('/urls', getSocialLoginUrls);

module.exports = router;