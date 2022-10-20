const { hivedClient } = require('utilities/steemApi/createClient');
const { PrivateKey, Asset } = require('@hiveio/dhive');

exports.transfer = async ({
  from, to, amount, memo = '', activeKey,
}) => {
  try {
    const data = await hivedClient.broadcast.transfer({
      from, to, amount: new Asset(amount, 'HIVE'), memo,
    }, PrivateKey.fromString(activeKey));
    return { result: true, data };
  } catch (error) {
    return { error };
  }
};
