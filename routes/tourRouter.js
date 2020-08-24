const express = require('express');
const tourRouter = express.Router();
const reviewRoute = require('./reviewRouter');
const tourController = require('./../controllers/tourController');
const authController = require('../controllers/authController');
//const reviewController = require('../controllers/reviewController');

// tourRouter.param('id', tourController.checkId);
//Getting the List of Tours within certain Limited
tourRouter
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getwithinradius);

//Getting the distance of each tour within my specified location
tourRouter
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.Getdistances);

tourRouter.use('/:tourid/reviews', reviewRoute);
tourRouter
  .route('/top-5-cheap')
  .get(tourController.cheapAndBestTours, tourController.getAllTours);

tourRouter.route('/get-stats-tour').get(tourController.getStats);

tourRouter
  .route('/get-monthly-Plan/:year')
  .get(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
//.post(tourController.checkBody, tourController.createTour);

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages, 
    tourController.updateTour
  )
  .delete(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// Instead of having routing in tour model we need to have in review router and we
//can use middleware for rerouting
// tourRouter
//   .route('/:tourid/reviews')
//   .post(
//     authController.protected,
//     authController.restrictTo('user'),
//     reviewController.createReviews
//   );

module.exports = tourRouter;
