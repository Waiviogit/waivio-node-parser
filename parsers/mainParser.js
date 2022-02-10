const {
  customJsonParser, commentParser, voteParser, userParsers,
  witnessVoteParser, transferParser, withdrawParser, recoveryParser, claimRewardParser,
} = require('parsers');
const { MAIN_OPS } = require('constants/parsersData');
const _ = require('lodash');

const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';

const parseSwitcher = async (transactions) => {
  const votesOps = [];

  for (const transaction of transactions) {
    if (transaction && transaction.operations && transaction.operations[0]) {
      for (const operation of transaction.operations) {
        if (!PARSE_ONLY_VOTES) {
          switch (operation[0]) {
            case MAIN_OPS.COMMENT:
              const options = _.get(transaction, 'operations[1][1]');
              await commentParser.parse(operation[1], options);
              break;
            case MAIN_OPS.DELETE_COMMENT:
              await commentParser.deleteComment(operation[1]);
              break;
            case MAIN_OPS.CUSTOM_JSON:
              await customJsonParser.parse(operation[1], transaction.block_num, transaction.transaction_id);
              break;
            case MAIN_OPS.ACCOUNT_UPDATE:
            case MAIN_OPS.ACCOUNT_UPDATE2:
              await userParsers.updateAccountParser(operation[1]);
              break;
            case MAIN_OPS.CREATE_CLAIMED_ACCOUNT:
            case MAIN_OPS.ACCOUNT_CREATE:
              await userParsers.createUser(operation[1]);
              break;
            case MAIN_OPS.VOTE:
              votesOps.push(operation[1]);
              break;
            case MAIN_OPS.ACCOUNT_WITNES_VOTE:
              await witnessVoteParser.parse(operation[1]);
              break;
            case MAIN_OPS.TRANSFER:
              await transferParser.parse(operation[1], transaction.block_num);
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
              await claimRewardParser.parse(operation[1]);
              break;
          }
        } else if (operation[0] === MAIN_OPS.VOTE) {
          votesOps.push(operation[1]);
        }
      }
    }
  }

  if (PARSE_ONLY_VOTES) {
    await voteParser.parse(votesOps);
  }
};

module.exports = {
  parseSwitcher,
};
