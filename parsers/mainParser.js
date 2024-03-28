const {
  customJsonParser, commentParser, voteParser, userParsers,
  witnessVoteParser, transferParser, withdrawParser, recoveryParser, claimRewardParser, delgationsParser,
} = require('parsers');
const { MAIN_OPS, REDIS_KEYS } = require('constants/parsersData');
const _ = require('lodash');
const redisSetter = require('utilities/redis/redisSetter');
const config = require('config');

const parseSwitcher = async (transactions, timestamp) => {
  if (config.parseOnlyVotes) {
    const ops = transactions.filter((t) => t.op.type === 'effective_comment_vote_operation').map((t) => ({ ...t.op.value, transaction_id: t.trx_id }));
    const votes = transactions.filter((t) => t.op.type === 'vote_operation').map((t) => {
      const effectiveVote = ops.find((v) => v?.transaction_id === t?.trx_id);
      return {
        ...t?.op?.value,
        transaction_id: t?.trx_id,
        rshares: +(effectiveVote?.rshares ?? 1),
      };
    });
    await voteParser.parse(votes);

    return;
  }

  for (const transaction of transactions) {
    if (transaction && transaction.operations && transaction.operations[0]) {
      for (const operation of transaction.operations) {
        if (!config.parseOnlyVotes) {
          switch (operation[0]) {
            case MAIN_OPS.COMMENT:
              await commentParser.parse({
                operation: operation[1],
                options: _.get(transaction, 'operations[1][1]'),
                transactionId: _.get(transaction, 'transaction_id'),
              });
              break;
            case MAIN_OPS.DELETE_COMMENT:
              await commentParser.deleteComment(operation[1]);
              break;
            case MAIN_OPS.CUSTOM_JSON:
              await customJsonParser.parse(operation[1], transaction.block_num, transaction.transaction_id, timestamp);
              break;
            case MAIN_OPS.ACCOUNT_UPDATE:
            case MAIN_OPS.ACCOUNT_UPDATE2:
              await userParsers.updateAccountParser(operation[1]);
              await redisSetter.publishToChannel({
                channel: REDIS_KEYS.TX_ID_MAIN,
                msg: _.get(transaction, 'transaction_id'),
              });
              break;
            case MAIN_OPS.CREATE_CLAIMED_ACCOUNT:
            case MAIN_OPS.ACCOUNT_CREATE:
              await userParsers.createUser(operation[1]);
              break;
            case MAIN_OPS.ACCOUNT_WITNES_VOTE:
              await witnessVoteParser.parse(operation[1]);
              break;
            case MAIN_OPS.TRANSFER:
              await transferParser.parse(operation[1], transaction.block_num);
              break;
            case MAIN_OPS.DELEGATE_VESTING_SHARES:
              await delgationsParser.parse(operation[1], timestamp);
              break;
            case MAIN_OPS.WITHDRAW_VESTING:
              await withdrawParser.parse(operation[1]);
              break;
            case MAIN_OPS.SET_WITHDRAW_VESTING_ROUTE:
              await withdrawParser.withdrawRoutesParse(operation[1]);
              break;
            case MAIN_OPS.TRANSFER_TO_VESTING:
              await transferParser.parseVesting(operation[1]);
              break;
            case MAIN_OPS.CHANGE_RECOVERY_ACCOUNT:
              await recoveryParser.parse(operation[1]);
              break;
            case MAIN_OPS.TRANSFER_FROM_SAVINGS:
              await transferParser.parseFromSavings(operation[1]);
              break;
            case MAIN_OPS.CLAIM_REWARD_BALANCE:
              await claimRewardParser.parse(operation[1], _.get(transaction, 'transaction_id'));
              break;
          }
        }
      }
    }
  }

  await userParsers.updateLastActivity({ transactions, timestamp });
};

module.exports = {
  parseSwitcher,
};
