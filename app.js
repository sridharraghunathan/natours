const express = require('express');
const ratelimit = require('express-rate-limit');
const mongosantize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const app = express();
const path = require('path');
const compression = require('compression')
const cookieParser = require('cookie-parser');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRouter');
const bookingRouter = require('./routes/bookingRouter');
const hpp = require('hpp');
const morgan = require('morgan');
const helmet = require('helmet');
const appErrors = require('./utils/appErrors');
const globalErrorController = require('./controllers/errorController');

// Middleware is required for POST request to receive the data from the client
const ratelimiter = ratelimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this client, try again after 1 hour.',
});

//Setting the Pug engine

app.set('view engine', 'pug');
app.set('views engine', path.join(__dirname, 'views'));

//Used for serving the static files
app.use(express.static(`${__dirname}/public`));

//Used for the Http Headers with security perspective.
// app.use(helmet());
// //Set Security HTTP headers
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       baseUri: ["'self'"],
//       fontSrc: ["'self'", 'https:', 'data:'],
//       scriptSrc: ["'self'", 'https://*.cloudflare. com'],
//       objectSrc: ["'none'"],
//       styleSrc: ["'self'", 'https:', 'unsafe-inline'],
//       upgradeInsecureRequests: [],
//     },
//   })
// );
//Used for Limiting the Number of request from the IP
app.use('/api', ratelimiter);
//Used for reading the data from body to req.body
app.use(
  express.json({
    limit: '10kb',
  })
);

// Cookie parsing
app.use(cookieParser());

//Data Sanitization from No SQL injection
app.use(mongosantize());

//Data Sanitization from XSS
app.use(xss());

//Compression for the response to the user user
app.use(compression());

//Parameter pollution
app.use(
  hpp({
    //Explicit
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Third party middleware for showing the status of the API
if (process.env.NODE_ENV === 'developement') {
  app.use(morgan('dev'));
}

//Custom Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies)
  // console.log(req.headers);
  //console.log('testing');
  next();
});
// we are using middleware for routing and having separate file we
// we use separate concept for routing called mounting
// This is for Client side routing App 
app.use('/', viewRouter);

// this is for API ROUTING
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Any route which doesnt satisfy the above route will be coming to this stage

app.use('*', (req, res, next) => {
  // const error = new Error(`Server not able to find the requested page ${req.originalUrl}`)
  // error.status = 'fail'
  // error.statusCode = '404'
  next(
    new appErrors(
      '404',
      `Server not able to find the requested page ${req.originalUrl}`
    )
  );
});

/// Middleware for handling the errors
app.use(globalErrorController);
//creating the server

module.exports = app;
