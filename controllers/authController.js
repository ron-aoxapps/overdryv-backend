const prisma = require('../client/prismaClient')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const { sendSuccess, sendError } = require('../utils/responses')
const { CODES } = require('../utils/statusCodes')

const authController = {}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const serializeProfile = (profile) => ({
  id: profile.id?.toString(),
  email: profile.email,
  first_name: profile.first_name,
  last_name: profile.last_name,
  phone: profile.phone ? profile.phone.toString() : null,
  role: profile.role,
  organization_id: profile.organization_id?.toString(),
  created_at: profile.created_at,
  updated_at: profile.updated_at,
});

// ----------------- LOGIN -----------------

authController.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return sendError(
        res,
        {},
        'Email and password are required.',
        CODES.BAD_REQUEST
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const profile = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
      include: { organization: true }
    })

    if (!profile) {
      return sendError(res, {}, 'Invalid email.', CODES.UNAUTHORIZED)
    }

    if (!profile.password || typeof profile.password !== 'string') {
      return sendError(
        res,
        {},
        'Password is not configured for this account.',
        CODES.BAD_REQUEST
      )
    }

    const isMatch = await bcrypt.compare(password, profile.password)

    if (!isMatch) {
      return sendError(res, {}, 'Invalid password.', CODES.UNAUTHORIZED)
    }

    const accessToken = jwt.sign(
      {
        userId: profile.id,
        email: profile.email,
        role: profile.role,
        organization_id: profile.organization_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    const refreshToken = jwt.sign(
      { userId: profile.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    })

    let url = null

    if (profile.organization?.subdomain) {
      const subdomain = String(profile.organization.subdomain)

      

      url = `https://manasic-calista-unelectronic.ngrok-free.dev/dashboard?access_token=${accessToken}&refresh_token=${refreshToken}`

      // url = `https://${subdomain}.overdryv.app/dashboard?access_token=${accessToken}&refresh_token=${refreshToken}`
    }
    

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        targetUrl: url,
        profile: serializeProfile(profile),
        organization: profile.organization || null
      },
      'Login successful.',
      CODES.OK
    )
  } catch (error) {
    console.error('Login Error:', error)
    return sendError(
      res,
      error.message,
      'Login failed.',
      CODES.INTERNAL_SERVER_ERROR
    )
  }
}

// ----------------- SESSION CHECK -----------------
authController.me = async (req, res) => {
  try {
    const userId = req.userId

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: { organization: true }
    })

    if (!profile) {
      return sendError(res, {}, 'Profile not found.', CODES.NOT_FOUND)
    }

    return sendSuccess(
      res,
      {
        // Mirrors Supabase `user` state in AuthContext — { id, email }
        user: {
          id: profile.id,
          email: profile.email,
        },
        // Mirrors Supabase `session` state in AuthContext — current tokens
        session: {
          access_token: profile.access_token || null,
          refresh_token: profile.refresh_token || null,
        },
        // Mirrors fetchProfile() result in AuthContext
        profile: serializeProfile(profile),
        // Mirrors `organization` state in AuthContext
        organization: profile.organization || null,
      },
      'Session valid.',
      CODES.OK
    )
  } catch (error) {
    console.error('Session Check Error:', error)
    return sendError(
      res,
      error.message,
      'Failed to fetch session.',
      CODES.INTERNAL_SERVER_ERROR
    )
  }
}

// ----------------- LOGOUT -----------------
authController.logout = async (req, res) => {
  try {
    const userId = req.userId

    await prisma.profile.update({
      where: { id: userId },
      data: {
        access_token: null,
        refresh_token: null
      }
    })

    return sendSuccess(res, {}, 'Logged out successfully.', CODES.OK)
  } catch (error) {
    console.error('Logout Error:', error)
    return sendError(
      res,
      error.message,
      'Logout failed.',
      CODES.INTERNAL_SERVER_ERROR
    )
  }
}

module.exports = authController
