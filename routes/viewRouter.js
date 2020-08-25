const express = require('express');
const router = express.Router();
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

// router.use(authController.isLoggedIn);
router.use(viewController.alertMessage);
router.get(
  '/',
  // bookingController.createbookingCheckOut,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.tourPage);
router.get('/login', authController.isLoggedIn, viewController.login);
router.get('/account', authController.protected, viewController.account);
router.get('/mybooking', authController.protected, viewController.mybooking);
module.exports = router;
