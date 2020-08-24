const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });
process.on('uncaughtException', (err) => {
  console.log(err);
  process.exit(1);
});
const port = process.env.PORT || 8000;
const app = require('./app');
const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    //console.log('Connection was succcessFull');
     
 
  });

const server = app.listen(port, () => {
 // console.log('waiting for the request !!!');
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err);
  process.exit(1);
});
