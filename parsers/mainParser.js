const _ = require('lodash');
const {followObjectParser} = require('../parsers');
const {commentParser} = require('../parsers');
const {voteParser} = require('../parsers');
const {postsUtil} = require('../utilities/steemApi');

const parseSwitcher = async transactions => {
    const votesOps = [];
    for (const transaction of transactions) {
        if (transaction && transaction.operations && transaction.operations[0]) {
            for (const operation of transaction.operations) {
                switch (operation[0]) {
                    case 'comment':
                        await commentParser.parse(operation[1]);
                        break;
                    case 'vote':
                        votesOps.push(operation[1]);
                        break;
                    case 'custom_json':
                        if (operation[1].id && operation[1].id === 'follow_wobject') {
                            await followObjectParser.parse(operation[1]);
                        }
                        break;
                }
            }
        }
    }
    await voteParser.parse(votesOps);
};

module.exports = {
    parseSwitcher
};