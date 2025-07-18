const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const generateTokenAndSetCookie = (user, res) => {
  const token = user.generateAccessToken();
  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    subscription: user.subscription
  };
  return res.status(200).json({ 
    message: "Success",
    user: userResponse, 
    token 
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if ([username, email, password].some(field => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required.");
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists.");
  }

  const user = await User.create({ username, email, password });
  return generateTokenAndSetCookie(user, res);
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }
  
  return generateTokenAndSetCookie(user, res);
});

const getUserProfile = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

module.exports = { registerUser, loginUser, getUserProfile };