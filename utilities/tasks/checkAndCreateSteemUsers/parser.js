const { userParsers } = require('parsers');


const usersParseSwitcher = async (transactions) => {
  for (const transaction of transactions) {
    if (transaction && transaction.operations && transaction.operations[0]) {
      for (const operation of transaction.operations) {
        switch (operation[0]) {
          case 'account_create':
            await userParsers.createUser(operation[1]);
            break;
          case 'create_claimed_account':
            await userParsers.createUser(operation[1]);
            break;
        }
      }
    }
  }
};

module.exports = { usersParseSwitcher };
