const ApiErrors = require('../utils/appErrors');

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path} : ${error.value}`;
  return new ApiErrors('400', message);
};

const handleDupicateKeyDb = (error) => {
  const value = error.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
  const message = `Duplicate Key value Enter ${value}. Try with Another value`;
  return new ApiErrors('400', message);
};

const handleValidationErrorDB = (err) => {
  const error = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Data ${error.join('. ')}`;
  return new ApiErrors('400', message);
};
const handleJwtError = (err) => new ApiErrors('401', 'Invalid token');
const handleJwtExpiredrror = (err) =>
  new ApiErrors('401', 'Token has been Expired');

const sendErrorDevelopment = (res, req, err) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'fail';
  if (req.originalUrl.startsWith('/api')) {
    err.status = err.status || 'fail';
    console.log(`statusCode : ${err.statusCode} and status : ${err.status}`);
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message : err.message
  });
};

const sendErrorProduction = (res, req, err) => {
  if (req.originalUrl) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'something went wrong',
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      status: err.status,
      message: err.message,
    });
  }

  return res.status(500).render('error', {
    status: 'error',
    message: 'something went wrong',
  });
};

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    sendErrorDevelopment(res, req, err);
  } else {
    let error = err;
    if (error.name === 'castError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDupicateKeyDb(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtError(error);
    if (error.name === 'TokenExpiredError') error = handleJwtExpiredrror(error);
    sendErrorProduction(res, req, error);
  }
};
