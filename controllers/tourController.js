const Tour = require('./../models/tourModels');
//const APIfeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const ApiErrors = require('../utils/appErrors');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

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

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover', // Field name of the model
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);
//for single tour we can use upload.single('fieldname')
//for multiple image for single field we can use upload.array('fieldname',3)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // req.files is an array
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, index) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    })
  );

  next();
});

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, 'reviews');
exports.createTour = factory.createone(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteone(Tour);

exports.getwithinradius = catchAsync(async (req, res, next) => {
  // sample '/tour-within/:distance/center/:latlng/unit/:unit')
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(
      new ApiErrors('404', 'Please Mention both Latitude and Longitude')
    );
  }

  const tour = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tour.length,
    data: {
      tour,
    },
  });
});

exports.Getdistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.0001;
  if (!lat || !lng) {
    return next(
      new ApiErrors('404', 'Please Mention both Latitude and Longitude')
    );
  }
  /*If we are using geo near pipeline in agg method then its should beb first in the pipeline


  */
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      distances,
    },
  });
});

exports.getStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $eq: 4.7 } },
    },
    {
      $group: {
        // _id: null,
        _id: '$difficulty',
        avgPrice: { $avg: '$price' },
        avgRatings: { $avg: '$ratingsAverage' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        numTours: { $sum: 1 },
      },
    },
    {
      $sort: { maxPrice: 2 },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const tourPlan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        monthlyTours: { $sum: 1 },
        tourName: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        month: -1,
      },
    },
    {
      $limit: 5,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      tourPlan,
    },
  });
});

// const filename = `${__dirname}/../dev-data/data/tours-simple.json`;
// getting the data from the file and converting to javascript object
// const tours = JSON.parse(fs.readFileSync(filename, 'utf-8'));

//checking the Id exist

// exports.checkId = (req, res, next, val) => {
//   console.log(`Tour id is ${val}`);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'failure',
//       message: 'Invalid Id given',
//     });
//   }
//   next(); /// this will not be called since the return function is mentioned
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     console.log(req.body.name);
//     return res.status(400).json({
//       status: 'failure',
//       message: 'Missing Name or price ',
//     });
//   }
//   next();
// };

exports.cheapAndBestTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,duration,ratingsAverage,price,summary';
  next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {

//   const features = new APIfeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limit()
//     .paginate();

//   const tours = await features.query;

//   res.status(200).json({
//     data: 'success',
//     results: tours.length,
//     tours: tours,
//   });
// });

// exports.getTour = catchAsync(async (req, res , next) => {
//   // const id = parseInt(req.params.id);
//   // const tour = tours.find((el) => el.id === id);

//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   console.log(tour)
//    if ( !tour ){
//       return next ( new ApiErrors('404',`Record Not Found`))
//    }

//   res.json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if ( !tour ){
//     return next ( new ApiErrors('404',`Record Not Found`))
//  }
//   res.status(200).json({
//     status: 'Success',
//     data: {
//       tour,
//     },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//  const  tour = await Tour.findByIdAndDelete(req.params.id);

//   if ( !tour ){
//     return next ( new ApiErrors('404',`Record Not Found`))
//  }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(200).json({
//     status: 'success',
//       newTour,
//   });

//   // try {
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'failure',
//   //     message: err,
//   //   });
//   //}

//   /*Adding the data received from the client to tours Array.
//       creating the id for the new tour .
//       Adding the data back to the file.
//   */

//   // const id = tours[tours.length - 1].id + 1;
//   // const newTour = Object.assign({ id },req.body);
//   // tours.push(newTour);

//   // fs.writeFile(filename, JSON.stringify(tours), () => {
//   //   res.status(201).json({
//   //     status: 'success',
//   //     newTour,
//   //   });
//   // });
// });
