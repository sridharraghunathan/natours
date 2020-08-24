const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

//const User = require('./userModels');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a Name'],
      unique: true,
      trim: true,
      minlength: [10, 'A tour must have more than 10 characters'],
      maxlength: [40, 'A tour must have less than 40 characters'],
      // validate:[validator.isAlpha,'A tour must contain only characters'] its an external valdiator
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can be of easy , medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A Rating should be minimum of 1.0 atleast need for rating'],
      max: [5, 'Rating cannot exceed morethan 5.0'],
      set : val => Math.round(val * 10 ) /10  // Round will change 4.666 to 5 So first changing to 46.6 t0 47 /10 
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price; // this will return true so no error
        },
        message: 'A price Discount should not be more than price',
      },
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startDates: [Date],
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      //GEOSPATIAL DATASET
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    //  guides: Array, for Embedding we use this type
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Creating the index for single columns or multi columns
tourSchema.index({slug :1});
tourSchema.index({price :1, ratingsAverage: -1});
// if we are using the geo spatial column then we need to use the  index for that columns
tourSchema.index({startLocation : '2dsphere'})

// Virtual field generating for showing not persisted in database.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate for the Child referencing
// tourSchema.virtual('reviewdata', {
//   ref: 'Review',
//   foreignField: 'tour',
//   localField: '_id',
// });


// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});


//Document Middle ware will be running when we hit post request SAVE and create we can pre and post
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

/// This is for the references Embedding the Object in the form of Array
// tourSchema.pre('save', async function (next) {
//   console.log(this.guides);

//   const guidePromise = this.guides.map(async (el) => {
//     return await User.findById(el);
//   });
//   console.log(guidePromise);
//   this.guides = await Promise.all(guidePromise);

//   next();
// });

// Middle ware find method for the pre and post finding the data

// tourSchema.pre('find', function (next) {

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChanged',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(
    `Query took total time of ${(Date.now() - this.start) / 1000} Seconds`
  );
  next();
});

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ match: { secretTour: false } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
