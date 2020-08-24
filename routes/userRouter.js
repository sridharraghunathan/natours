const express = require('express');
const userRouter = express.Router();
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

userRouter.post('/signup', authController.signUp);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);
userRouter.post('/forgetPassword', authController.forgetPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

// if we keep this middleware then we dont need to protect everytime this will take care of that
userRouter.use(authController.protected);

userRouter.get('/myDetails', userController.getMe, userController.getUser);
userRouter.patch('/updateMyPassword', authController.updatePassword);
userRouter.patch(
  '/updateMydetails',
  userController.uploadUserPhoto,
  userController.resizePhoto,
  userController.updateMe
);
userRouter.delete(
  '/deleteMydetails',
  userController.deleteMe,
  userController.getUser
);

// this will enable all the below activity performed by Admin.
userRouter.use(authController.restrictTo('admin'));

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
