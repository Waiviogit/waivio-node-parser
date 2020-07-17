const _ = require('lodash');
const co = require('co');
const axios = require('axios');
const { User, Wallet } = require('database').models;
const { WALLET_LENGTH } = require('constants/appData');

const TYPES_FOR_PARSE = ['transfer', 'transfer_to_vesting', 'claim_reward_balance', 'transfer_to_savings', 'transfer_from_savings'];
const hiveUrl = 'https://anyx.io';

exports.start = async () => {
  await co(function *iterateCursor() {
    const cursor = User.find({ name: 'olegvladim' }).lean().cursor();
    for (let doc = yield cursor.next(); doc != null; doc = yield cursor.next()) {
      let wallet = yield getWalletData(doc.name, WALLET_LENGTH);
      const userDBWallet = yield Wallet.find(
        { $or: [{ account: doc.name }, { $and: [{ to: doc.name }, { account: { $ne: doc.name } }] }] },
      );
      wallet = _.sortBy(wallet, 'timestamp');
      wallet = wallet.slice(userDBWallet.length, wallet.length);
      for (const record of wallet) {
        const recordDB = yield Wallet.findOne({ trxId: record.trx_id });
        if (!recordDB) {
          let data;
          switch (record.type) {
            case 'transfer':
              record.account = record.from;
              record.trxId = record.trx_id;
              data = record;
              break;
            case 'transfer_to_vesting':
              break;
            case 'claim_reward_balance':
              break;
            case 'transfer_to_savings':
              break;
            case 'transfer_from_savings':
              break;
          }
          data = new Wallet(record);
          console.log();
          yield data.save();
        }
      }
      yield User.updateOne({ _id: doc._id }, { stage_version: 1 });
    }
    console.log('task update payouts done!');
  });
};

(async () => {
  await this.start();
})();

const getWalletData = async (name, limit) => {
  let result;
  const batchSize = 1000;
  let lastId = -1;
  const walletOperations = [];
  do {
    ({ result } = await getAccountHistory(name, lastId));
    for (const record of result) {
      if (_.includes(TYPES_FOR_PARSE, _.get(record, '[1].op[0]'))) {
        walletOperations.push(record);
        if (walletOperations.length === limit) break;
      }
    }
    if (walletOperations.length === limit) break;
    lastId = _.get(result, '[0][0]');
  } while (walletOperations.length <= limit || batchSize === result.length - 1);
  return formatHiveHistory(walletOperations);
};

const formatHiveHistory = (histories) => _.map(histories, (history) => {
  history[1].timestamp = Math.round(new Date(history[1].timestamp).valueOf() / 1000);
  // eslint-disable-next-line prefer-destructuring
  history[1].type = history[1].op[0];
  history[1] = Object.assign(history[1], history[1].op[1]);
  return _.omit(history[1], ['op', 'block', 'op_in_trx', 'trx_in_block', 'virtual_op']);
});

const getAccountHistory = async (name, id) => {
  try {
    const result = await axios.post(hiveUrl, {
      jsonrpc: '2.0',
      method: 'call',
      params: [
        'database_api',
        'get_account_history',
        [name, id, 1000],
      ],
    });
    return { result: result.data.result };
  } catch (error) {
    return { error };
  }
};
