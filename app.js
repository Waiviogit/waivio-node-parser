const express = require('express');
const logger = require('morgan');
const { routes } = require('routes');
const { runStream } = require('processor/processor');
require('utilities/jobs');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', routes);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

runStream().catch((err) => {
  console.log(err);
  process.exit(1);
});

module.exports = app;
