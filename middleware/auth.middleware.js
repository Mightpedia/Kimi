const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET } = require('../config/env');

const authMiddleware = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new ApiError(401, 'Unauthorized request: No token provided.');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      throw new ApiError(401, 'Invalid token: User not found.');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid token.');
  }
});

module.exports = { authMiddleware };