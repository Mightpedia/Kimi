const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } = require('../config/env');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  subscription: { type: String, enum: ['free', 'premium'], default: 'free' },
  apiCalls: { type: Number, default: 0 },
  dailyLimit: { type: Number, default: 100 },
  lastApiCall: { type: Date } // Corrected: Added this field
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { _id: this._id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

const User = mongoose.model('User', userSchema);
module.exports = User;