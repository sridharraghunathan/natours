// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModels');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


reviewSchema.index({ tour: 1, review: 1 }, {unique : true});
reviewSchema.statics.calculateAverageRating = async function (tourId) {
  // this keyword refers to model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numReview: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
    // For showing the column like select
    // {
    //   $project: { numReview: 1, avgRatings: { $round: ['$avgRating', 2] } },
    // },
  ]);
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      // ratingsAverage: stats[0].avgRatings,
      ratingsAverage: stats[0].avgRating,
      ratingQuantity: stats[0].numReview,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingQuantity: 0,
    });
  }
};

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.post('save', function () {
  // this.tour refers to current saved review from there we can tourid
  //this constructor refers to model.
  this.constructor.calculateAverageRating(this.tour);
});

//pre query middleware for fetching the _id
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.reviewInfo = await this.findOne();
  next();
});

//Post Middleware for executing the function
reviewSchema.post(/^findOneAnd/, async function () {
  this.reviewInfo.constructor.calculateAverageRating(this.reviewInfo.tour);
});

const Review = mongoose.model('Review', reviewSchema);
//Review.collection.dropIndex({ tour: 1, review: 1 });
module.exports = Review;

