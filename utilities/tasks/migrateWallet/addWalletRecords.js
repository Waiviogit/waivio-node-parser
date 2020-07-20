const _ = require('lodash');
const co = require('co');
const axios = require('axios');
const { User, Wallet } = require('database').models;
const { WALLET_LENGTH } = require('constants/appData');

const TYPES_FOR_PARSE = ['transfer', 'transfer_to_vesting', 'claim_reward_balance', 'transfer_to_savings', 'transfer_from_savings'];
const hiveUrl = 'https://anyx.io';

exports.start = async () => {
  await co(function *iterateCursor() {
    const cursor = User.find({ stage_version: 0 }).lean().cursor();
    for (let doc = yield cursor.next(); doc != null; doc = yield cursor.next()) {
      let wallet = yield getWalletData(doc.name, WALLET_LENGTH);
      const userDBWallet = yield Wallet.find({
        $or: [{ account: doc.name },
          { $and: [{ to: doc.name }, { account: { $ne: doc.name } }] }],
      }).lean();
      wallet = _.chain(userDBWallet)
        .concat(wallet)
        .uniqBy('trx_id')
        .orderBy(['timestamp'], ['desc'])
        .value();
      wallet = wallet.slice(0, WALLET_LENGTH);
      for (const record of wallet) {
        const condition = { trx_id: record.trx_id };
        if (record.to)condition.to = record.to;
        const result = yield Wallet.findOne(condition);
        if (result) continue;
        let data;
        switch (record.type) {
          case 'transfer_to_savings':
          case 'transfer_from_savings':
          case 'transfer':
          case 'transfer_to_vesting':
            record.account = record.from;
            data = record;
            break;
          case 'claim_reward_balance':
            data = record;
            break;
        }
        data = new Wallet(record);
        yield data.save();
      }
      console.log(`Import wallet for user ${doc.name} finished`);
      yield User.updateOne({ _id: doc._id }, { stage_version: 1 });
    }
    console.log('task update payouts done!');
  });
};

const getWalletData = async (name, limit) => {
  let result, error, data;
  const batchSize = 1000;
  let lastId = -1;
  const walletOperations = [];
  do {
    if (lastId === 0) break;
    ({ result, error, data } = await getAccountHistory(name, lastId, lastId === -1 ? 1000 : (lastId < 1000 ? lastId : 1000)));
    if (error) return [];
    if (!_.isArray(result)) {
      console.log(lastId);
      console.error(data);
      console.error(result);
      continue;
    }
    lastId = _.get(result, '[0][0]');
    result = _.reverse(result);
    for (const record of result) {
      if (_.includes(TYPES_FOR_PARSE, _.get(record, '[1].op[0]'))) {
        walletOperations.push(record);
        if (walletOperations.length === limit) break;
      }
    }
    if (walletOperations.length === limit) break;
  } while (walletOperations.length <= limit || batchSize === result.length - 1);
  return formatHiveHistory(walletOperations);
};

const formatHiveHistory = (histories) => _.map(histories, (history) => {
  history[1].timestamp = Math.round(new Date(history[1].timestamp).valueOf() / 1000) + 10800;
  // eslint-disable-next-line prefer-destructuring
  history[1].type = history[1].op[0];
  history[1] = Object.assign(history[1], history[1].op[1]);
  return _.omit(history[1], ['op', 'block', 'op_in_trx', 'trx_in_block', 'virtual_op']);
});

const getAccountHistory = async (name, id, limit) => {
  try {
    const result = await axios.post(hiveUrl, {
      jsonrpc: '2.0',
      method: 'call',
      params: [
        'database_api',
        'get_account_history',
        [name, id, limit],
      ],
    });
    return { result: result.data.result, data: result.data };
  } catch (error) {
    return { error };
  }
};
