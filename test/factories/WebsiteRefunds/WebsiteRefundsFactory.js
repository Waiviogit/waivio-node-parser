const { REFUND_TYPES, REFUND_STATUSES } = require('constants/sitesData');
const { WebsitesRefund, faker } = require('test/testHelper');

const Create = async ({
  name, type, description, status,
} = {}) => {
  const refundData = {
    userName: name || faker.name.firstName(),
    type: type || REFUND_TYPES.WEBSITE_REFUND,
    status: status || REFUND_STATUSES.PENDING,
    blockNum: faker.random.number(),
    description: description || '',
  };
  const refund = new WebsitesRefund(refundData);
  await refund.save();

  return refund.toObject();
};

module.exports = { Create };
