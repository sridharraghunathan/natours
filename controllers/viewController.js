const Tour = require('./../models/tourModels');
const Booking = require('./../models/bookingModels');
const catchAsync = require('../utils/catchAsync');
const ApiErrors = require('../utils/appErrors');

exports.alertMessage = (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'Booking') {
    req.locals.alert =
      'Your Booking has been completed Successfully, Payment has been received , \
       if you are not the booked request in the current page , please open the website after somtime.';
  }

  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  //1 ) Get the Tour Data from the database

  const tours = await Tour.find();

  //2) Build the dynamic template
  //3 ) render the dynamic template

  res.status(200).render('overview', {
    title: 'All tours',
    tourInfo: ' Overview of Natours',
    tours,
  });
});

exports.tourPage = catchAsync(async (req, res, next) => {
  //1) get tours information from the slug

  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'rating review user',
  });

  if (!tour) {
    return next(new ApiErrors('404', 'Tour Name not found'));
  }

  res.status(200).render('tour', {
    title: tour.slug,
    tour,
  });
});

exports.login = (req, res) => {
  //render('pug temaplate name')
  res.status(200).render('login', { title: 'Login' });
};

exports.signup = (req, res) => {
  res.status(200).render('signup', { title: 'Create Your Account' });
};

exports.account = (req, res) => {
  res.status(200).render('accounts', { title: ' You Account' });
};

exports.mybooking = async (req, res) => {
  const bookedtour = await Booking.find({ user: req.user.id });
  const tourIds = bookedtour.map((ele) => ele.tour._id);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  res.status(200).render('overview', { title: 'My booking', tours });
};
