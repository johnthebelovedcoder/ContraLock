const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class SocialAuthService {
  // Handle Google login
  async handleGoogleLogin(idToken) {
    try {
      // Verify the Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const googleId = payload['sub'];
      const email = payload['email'];
      const firstName = payload['given_name'];
      const lastName = payload['family_name'];
      const picture = payload['picture'];

      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId });

      if (user) {
        // Update user's info from Google if needed
        user.firstName = firstName;
        user.lastName = lastName;
        user.profile.avatar = picture;
        user.lastLoginAt = new Date();
        await user.save();
      } else {
        // Check if user exists with this email (they might have registered with email before)
        user = await User.findOne({ email });
        
        if (user) {
          // Link Google account to existing account
          user.googleId = googleId;
          user.emailVerified = true; // Google email is verified
          user.lastLoginAt = new Date();
          await user.save();
        } else {
          // Create new user with Google account
          const password = await bcrypt.hash(Math.random().toString(36).substring(2, 15), 12);
          
          user = await User.create({
            email,
            password, // Random password since they'll use Google login
            firstName,
            lastName,
            role: 'client', // Default to client, can be changed later
            status: 'verified',
            googleId,
            emailVerified: true,
            profile: {
              avatar: picture,
              completed: false
            },
            lastLoginAt: new Date()
          });
        }
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profile: user.profile
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw new Error('Google authentication failed: ' + error.message);
    }
  }

  // Handle LinkedIn login
  async handleLinkedInLogin(authorizationCode) {
    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user profile info
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const profileData = profileResponse.data;

      // Get user email
      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const email = emailResponse.data.elements[0]['handle~'].emailAddress;

      // Check if user already exists with this LinkedIn ID
      let user = await User.findOne({ linkedinId: profileData.id });

      if (user) {
        // Update user's info from LinkedIn if needed
        user.firstName = profileData.firstName?.localized?.en_US || user.firstName;
        user.lastName = profileData.lastName?.localized?.en_US || user.lastName;
        user.lastLoginAt = new Date();
        await user.save();
      } else {
        // Check if user exists with this email
        user = await User.findOne({ email });
        
        if (user) {
          // Link LinkedIn account to existing account
          user.linkedinId = profileData.id;
          user.emailVerified = true;
          user.lastLoginAt = new Date();
          await user.save();
        } else {
          // Create new user with LinkedIn account
          const password = await bcrypt.hash(Math.random().toString(36).substring(2, 15), 12);
          
          user = await User.create({
            email,
            password, // Random password since they'll use LinkedIn login
            firstName: profileData.firstName?.localized?.en_US || '',
            lastName: profileData.lastName?.localized?.en_US || '',
            role: 'freelancer', // Default to freelancer for LinkedIn
            status: 'verified',
            linkedinId: profileData.id,
            emailVerified: true,
            profile: {
              completed: false
            },
            lastLoginAt: new Date()
          });
        }
      }

      // Generate JWT tokens
      const accessTokenJWT = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '15m' }
      );

      const refreshTokenJWT = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profile: user.profile
        },
        accessToken: accessTokenJWT,
        refreshToken: refreshTokenJWT
      };
    } catch (error) {
      throw new Error('LinkedIn authentication failed: ' + error.message);
    }
  }

  // Handle Google login with authorization code (for OAuth callback flow)
  async handleGoogleLoginWithCode(authorizationCode) {
    try {
      // Exchange authorization code for tokens
      const { tokens } = await googleClient.getToken(authorizationCode);
      const idToken = tokens.id_token;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Verify the ID token
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const googleId = payload['sub'];
      const email = payload['email'];
      const firstName = payload['given_name'];
      const lastName = payload['family_name'];
      const picture = payload['picture'];

      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId });

      if (user) {
        // Update user's info from Google if needed
        user.firstName = firstName;
        user.lastName = lastName;
        user.profile.avatar = picture;
        user.lastLoginAt = new Date();
        await user.save();
      } else {
        // Check if user exists with this email (they might have registered with email before)
        user = await User.findOne({ email });

        if (user) {
          // Link Google account to existing account
          user.googleId = googleId;
          user.emailVerified = true; // Google email is verified
          user.lastLoginAt = new Date();
          await user.save();
        } else {
          // Create new user with Google account
          const password = await bcrypt.hash(Math.random().toString(36).substring(2, 15), 12);

          user = await User.create({
            email,
            password, // Random password since they'll use Google login
            firstName,
            lastName,
            role: 'client', // Default to client, can be changed later
            status: 'verified',
            googleId,
            emailVerified: true,
            profile: {
              avatar: picture,
              completed: false
            },
            lastLoginAt: new Date()
          });
        }
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profile: user.profile
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw new Error('Google authentication failed: ' + error.message);
    }
  }
}

module.exports = new SocialAuthService();