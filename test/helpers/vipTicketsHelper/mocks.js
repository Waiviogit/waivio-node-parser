const _ = require('lodash');
const faker = require('faker');

exports.transferData = ({
  from, to, amount, blockNum,
} = {}) => ({
  from: from || faker.random.string(),
  to: to || faker.random.string(),
  amount: amount || `${_.random(4.5, 50)} HIVE`,
  blockNum: blockNum || _.random(0, 50),
});
