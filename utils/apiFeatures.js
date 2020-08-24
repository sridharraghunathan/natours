class APIfeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      const queryObj = { ...this.queryString };
      const excludeList = ['sort', 'limit', 'page', 'fields'];
      excludeList.forEach((el) => delete queryObj[el]);
  
      let queryFind = JSON.stringify(queryObj);
      queryFind = JSON.parse(
        queryFind.replace(/\b(lt|lte|gt|gte)\b/g, (match) => `$${match}`)
      );
      this.query = this.query.find(queryFind);

      return this;
    }
  
    sort() {

      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(',').join(' ');
        //for multiple column sort it should be like 'col1 col2'
        this.query = this.query.sort(sortBy);
      } else {
        this.query = this.query.sort('-createdAt');
      }
  
      return this;
    }
  
    limit() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(',').join(' ');
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select('-__v'); //excluding this field
      }
      return this;
    }
  
    paginate() {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 12;
      const skip = (page - 1) * limit;
  
      this.query = this.query.skip(skip).limit(limit);
  
      // if (this.queryString.page) {
      //   const totalDoc =  await this.query.countDocuments();
      //   console.log(totalDoc, skip);
      //   if (skip >= totalDoc)  throw new Error('No more records to show');
      // }
  
      return this;
    }
  }

  module.exports = APIfeatures;