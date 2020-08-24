const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const reviewRouter = express.Router({ mergeParams: true }); // this will enable to access the param value of another route.

//this is will be matching with both routes
// POST /tour/111/reviews
//POST /reviews

reviewRouter.use(authController.protected);
reviewRouter
  .route('/')
  .get(reviewController.getReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.modifyPostReviewRequest,
    reviewController.createReviews
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = reviewRouter;
