const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Booking = require('../models/bookingModels');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  console.log('checkout session');
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  console.log(tour);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // Always give in single line for safer side
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], // images we need to metion server url.
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createbookingCheckOut = async (req, res, next) => {
  // This is temporary solution which is not secure but after deploying will Fix it
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
};

//All this API is required for the Admin Activities
//Function Name is case sensitive
exports.getAllBooking = factory.getAll(Booking);
exports.getOneBooking = factory.getOne(Booking);
exports.createBooking = factory.createone(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteone(Booking);
