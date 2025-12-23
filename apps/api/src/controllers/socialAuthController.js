const socialAuthService = require('../services/socialAuthService');
const { BadRequestError } = require('../errors/AppError');

// Google login - direct token exchange
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return next(new BadRequestError('ID token is required'));
    }

    const result = await socialAuthService.handleGoogleLogin(idToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// LinkedIn login - direct code exchange
const linkedinLogin = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return next(new BadRequestError('Authorization code is required'));
    }

    const result = await socialAuthService.handleLinkedInLogin(code);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Google OAuth callback endpoint
const googleCallback = async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=${encodeURIComponent('No authorization code received')}`);
    }

    // Exchange the authorization code for tokens and get user info
    const result = await socialAuthService.handleGoogleLoginWithCode(code);

    // Redirect to frontend with tokens as URL parameters
    const { accessToken, refreshToken, user } = result;
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?provider=google&accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=${encodeURIComponent('Google authentication failed')}`);
  }
};

// LinkedIn OAuth callback endpoint
const linkedinCallback = async (req, res, next) => {
  try {
    const { code, error, state } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=${encodeURIComponent('No authorization code received')}`);
    }

    // Exchange the authorization code for tokens and get user info
    const result = await socialAuthService.handleLinkedInLogin(code);

    // Redirect to frontend with tokens as URL parameters
    const { accessToken, refreshToken, user } = result;
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?provider=linkedin&accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=${encodeURIComponent('LinkedIn authentication failed')}`);
  }
};

// Get social login URLs
const getSocialLoginUrls = (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20profile%20email&access_type=offline`;

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&scope=r_emailaddress%20r_liteprofile`;

  res.json({
    googleUrl: googleAuthUrl,
    linkedinUrl: linkedinAuthUrl
  });
};

module.exports = {
  googleLogin,
  linkedinLogin,
  googleCallback,
  linkedinCallback,
  getSocialLoginUrls
};