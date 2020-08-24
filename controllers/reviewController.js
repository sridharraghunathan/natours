const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Review = require('./../models/reviewModel');
const ApiErrors = require('../utils/appErrors');

exports.modifyPostReviewRequest = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourid;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReviews = factory.createone(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteone(Review);

// exports.getReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourid) filter = { tour: req.params.tourid };
//   const review = await Review.find(filter);
//   res.status(200).json({
//     status: ' success',
//     results: review.length,
//     data: {
//       review,
//     },
//   });
// });

// exports.createReviews = catchAsync(async (req, res, next) => {
//   const newReview = await Review.create(req.body);

//   res.status(200).json({
//     status: ' success',
//     data: {
//       newReview,
//     },
//   });
// });
