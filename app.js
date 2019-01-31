const express = require('express');
const logger = require('morgan');
const {routes} = require('./routes');
const {redisSetter} = require('./utilities/redis');
const app = express();

redisSetter.setParserStarted(0);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use('/', routes);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

module.exports = app;
