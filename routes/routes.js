
const { processor } = require('../processor');

const express = require('express');

const routes = express.Router();

routes.use('/waivio-parser', routes);

routes.route('/parse-from-start')
    .post(processor.parseAllBlockChain);
routes.route('/run-stream')
    .post(processor.runStream);
routes.route('/get-current-block')
    .post(processor.getCurrentBlock);

module.exports = routes;
