const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const rateLimitMiddleware = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const today = new Date().toDateString();

  if (!user.lastApiCall || user.lastApiCall.toDateString() !== today) {
    user.apiCalls = 0;
  }
  
  if (user.apiCalls >= user.dailyLimit) {
    throw new ApiError(429, 'Daily API limit exceeded.');
  }

  user.apiCalls += 1;
  user.lastApiCall = new Date();
  await user.save({ validateBeforeSave: false }); 
  
  next();
});

module.exports = { rateLimitMiddleware };