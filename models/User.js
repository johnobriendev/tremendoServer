const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' }, 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  refreshToken: { type: String, default: null}
});

const User = mongoose.model('User', userSchema);

module.exports = User;