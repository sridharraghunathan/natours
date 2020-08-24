const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please Enter Name'],
  },
  email: {
    type: String,
    required: [true, 'please Enter email id'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'please enter valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['admin', 'lead-guide', 'guide', 'user'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: [8, 'Password must be more than 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    // required: [true, 'Please confirm password'],
    validate: {
      validator: function (el) {
        return el === this.password; // validating the password
      },
    },
  },
  passwordChanged: {
    type: Date,
  },
  passwordresetToken: String,
  passwordExpireToken: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //Only run this function if password was actually changed
  if (!this.isModified('password')) return next();
  //Hasing the password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified(this.password) || this.isNew) return next();
  this.passwordChanged = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.resetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordresetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordExpireToken = Date.now() + 10 * 60 * 1000; // converting to milliseconds here 10mins as 6000 milli seconds
  return resetToken;
};

userSchema.methods.changedPassword = function (JWTTokenIssuedDate) {
  if (this.passwordChanged) {
    const FormatChangePasswordAt = parseInt(
      this.passwordChanged.getTime() / 1000,
      10
    );
    return FormatChangePasswordAt > JWTTokenIssuedDate; // 100 >50
  }
  return false; // this means password was not changed
};

const User = mongoose.model('User', userSchema);

module.exports = User;
