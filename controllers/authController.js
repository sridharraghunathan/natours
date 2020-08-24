const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const appErrors = require('../utils/appErrors');
//const sendEmail = require('../utils/email');
const Email = require('../utils/email');
const { response } = require('express');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_TOKEN, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createToken = (user, statusCode,request, response) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure : request.secure ||request.header['x-forwarded-proto'] === 'https'
  };

 // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  token = generateToken(user._id);
  response.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  response.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user,
    },
  });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ('403', 'You are not authorised to modify the content')()
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  //checking the user
  if (!user) {
    return next(new appErrors('404', 'Email Id entered is not exist!!!'));
  }

  // Creating the reset token
  const resetToken = await user.resetPasswordToken();
  // This will prevent the Validation of required columns against database
  await user.save({ validateBeforeSave: false });

  // Email to User
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Please reset the Password Using the mentioned link ${resetUrl} also enter password and confirm password \n`;
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password reset Link (valid for 10 mins)',
    //   message,
    // });

    await new Email(user,resetUrl).sendPasswordReset()

    res.status(200).json({
      status: 'Success',
      message: 'Token has been sent to user',
    });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.passwordExpireToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new appErrors('501', err));
  }
});

exports.protected = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // Checking token available
  if (!token) {
    return next(
      new appErrors('401', 'You have no valid token, please Login again !')
    );
  }

  // verify the token is valid or not
  const decode = await promisify(jwt.verify)(token, process.env.JWT_TOKEN);

  // verify user still exist user got deleted after the token issued

  const currentUser = await User.findById(decode.id);
  if (!currentUser) {
    return next(
      new appErrors('401', 'User has been deleted and token is not valid')
    );
  }

  //verify if user has changed the password after token has been changed

  if (currentUser.changedPassword(decode.iat)) {
    return next(new appErrors('401', 'Password was changed recently'));
  }

  // GRANT ACCESS
  req.user = currentUser;
  res.locals.user = currentUser;
 // console.log(req.user);
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // verify the token is valid or not
      const decode = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_TOKEN
      );

      // verify user still exist user got deleted after the token issued
      const currentUser = await User.findById(decode.id);

      //verify if user has changed the password after token has been changed
      if (currentUser.changedPassword(decode.iat)) {
        return next();
      }

      // GRANT ACCESS
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.signUp = catchAsync(async (req, res, next) => {
  //const user = await User.create(req.body);
  const user = await User.create({
    name: req.body.name,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    email: req.body.email,
    passwordChanged: req.body.passwordChanged,
  });

  jwt.sign({ id: user._id }, process.env.JWT_TOKEN, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const url = `${req.protocol}://${req.get('host')}/account`;
 // console.log(url);
  await new Email(user, url).sendWelcome();

  createToken(user, 200,req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check email and password are entered
  if (!email || !password) {
    return next(new appErrors('400', 'Email Id or Password is not entered'));
  }

  //check user and password are valid
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appErrors('401', 'Email Id or Password is in correct'));
    // return next(new appErrors('401', 'Email Id or Password is incorrect'));
  }

  //Generate the token for the user

  createToken(user, 200,req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status('200').json({ status: 'success' });
};
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get the plain token sent to user and convert to hash value
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2) check those against database and check it doesnt exceed 10 mins
  const user = await User.findOne({
    passwordresetToken: hashToken,
    passwordExpireToken: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new appErrors(
        '400',
        'Token has expired, please request for forgot password.'
      )
    );
  }
  token = generateToken(user._id);

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordExpireToken = undefined;
  user.passwordresetToken = undefined;
  await user.save();
  // 3) update the changePasswordAt

  createToken(user, 200,req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get logged in user information

  const user = await User.findById(req.user.id).select('+password');
  //this will give user object
 // console.log(req.body.passwordCurrent, user.password);

  //2) check the password from user information and verify with password.
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      '403',
      'Password mentioned is not matching with current password.'
    );
  }

  //3) Update the password to backend
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4) Login in the user with New JWT TOKEN
  createToken(user, 200,req, res);
});
