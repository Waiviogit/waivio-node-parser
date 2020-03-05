const {
  customJsonParser, commentParser, voteParser, userParsers, witnessVoteParser, transferParser,
} = require('parsers');
const { usersParseSwitcher } = require('utilities/tasks/checkAndCreateSteemUsers/parser');

const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';

const parseSwitcher = async (transactions, task) => {
  const votesOps = [];
  if (!task) {
    for (const transaction of transactions) {
      if (transaction && transaction.operations && transaction.operations[0]) {
        for (const operation of transaction.operations) {
          if (!PARSE_ONLY_VOTES) {
            switch (operation[0]) {
              case 'comment':
                await commentParser.parse(operation[1]);
                break;
              case 'custom_json':
                await customJsonParser.parse(operation[1]);
                break;
              case 'account_update':
                await userParsers.updateAccountParser(operation[1]);
                break;
              case 'create_claimed_account':
                await userParsers.createUser(operation[1]);
                break;
              case 'account_create':
                await userParsers.createUser(operation[1]);
                break;
              case 'vote':
                votesOps.push(operation[1]);
                break;
              case 'account_witness_vote':
                await witnessVoteParser.parse(operation[1]);
                break;
              case 'transfer':
                await transferParser.parse(operation[1]);
                break;
            }
          } else if (operation[0] === 'vote') {
            votesOps.push(operation[1]);
          }
        }
      }
    }
  }
  if (PARSE_ONLY_VOTES) {
    await voteParser.parse(votesOps);
  } else if (task) {
    switch (task) {
      case 'add_users_last_block_num':
        await usersParseSwitcher(transactions);
        break;
    }
  }
};

module.exports = {
  parseSwitcher,
};
