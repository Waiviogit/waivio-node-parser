const { faker } = require('test/testHelper');

exports.getTransferOperation = ({
  from, to, amount, memo,
}) => {
  const operation = {
    from: from || faker.random.string(20),
    to: to || faker.random.string(20),
    amount: amount || faker.random.number.toString(),
    memo: memo || '',
  };
  return operation;
};
