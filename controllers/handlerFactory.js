const catchAsync = require('./../utils/catchAsync');
const ApiErrors = require('./../utils/appErrors');
const APIfeatures = require('./../utils/apiFeatures');

exports.createone = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(200).json({
      status: ' success',
      data: {
        data: doc,
      },
    });
  });

exports.deleteone = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(Model);
    const doc = await Model.findByIdAndDelete(req.params.id);
    console.log(doc);
    if (!doc) {
      return next(new ApiErrors('404', `No document found for mentioned Id`));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new ApiErrors('404', `No document found for mentioned Id`));
    }
    res.status(200).json({
      status: 'Success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = {};
    query = Model.findById(req.params.id);
    console.log('data :'+req.params.id)
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(new ApiErrors('404', `No document found for mentioned Id`));
    }
    res.json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourid) filter = { tour: req.params.tourid };

  const features = new APIfeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limit()
    .paginate();

 // const tours = await features.query.explain();
  const tours = await features.query;


  res.status(200).json({
    data: 'success',
    results: tours.length,
    tours: tours,
  });
});
