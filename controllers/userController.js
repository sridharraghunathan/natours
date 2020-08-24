const User = require('./../models/userModels');
const catchAsync = require('./../utils/catchAsync');
const appErrors = require('../utils/appErrors');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

//For uploading the file of the image formatter for storing to the disk
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const fileExtension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${fileExtension}`);
//   },
// });

// For storing the data to the to the in memory
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new appErrors('Not An image , please upload only image'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const filterRequest = (obj, ...allowedData) => {
  let newobject = {};
  Object.keys(obj).forEach((key) => {
    if (allowedData.includes(key)) {
      newobject[key] = obj[key];
    }
  });
  return newobject;
};


exports.uploadUserPhoto = upload.single('photo');
exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.resizePhoto = catchAsync( async (req, res, next) => {
  // 1) check if the file exist
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) check whether password details were not give.
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new appErrors('400', 'Password should not be mentioned in this route')
    );
  }

  //2) Filter the necessary Object from the request body

  const filterObject = filterRequest(req.body, 'name', 'email');
  if (req.file) filterObject.photo = req.file.filename;

  //3) update the data into Database

  const user = await User.findByIdAndUpdate(req.user.id, filterObject, {
    new: true,
    runValidators: true,
  });
  // user.name = req.body.name;

  // await user.save();

  //4) send the result to the user
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    data: 'success',
  });
});
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteone(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'Routes are not defined',
  });
};
