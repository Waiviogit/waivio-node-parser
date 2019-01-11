const _ = require('lodash');
const {followObjectParser} = require('../parsers');
const {commentParser} = require('../parsers');
const {voteParser} = require('../parsers');

const parseSwitcher = async transactions => {
    for (const transaction of transactions){
        if (transaction && transaction.operations && transaction.operations[0]) {
            for (const operation of transaction.operations){
                switch (operation[0]) {
                    case 'account_create':
                    case 'account_create_with_delegation':
                    case 'account_update':
                    case 'withdraw_vesting':
                    case 'claim_reward_balance':
                    case 'return_vesting_delegation':
                    case 'account_witness_vote':
                    case 'account_witness_proxy':
                    case 'author_reward':
                    case 'comment':
                        await commentParser.parse(operation[1]);
                        break;
                    case 'vote':
                        await voteParser.parse(operation[1]);
                        break;
                    case 'cancel_transfer_from_savings':
                    case 'change_recovery_account':
                    case 'comment_benefactor_reward':
                    case 'curation_reward':
                    case 'custom':
                    case 'custom_json':
                        if (operation[1].id && operation[1].id === 'follow_wobject') {
                            await followObjectParser.parse(operation[1]);
                        }
                        break;
                    case 'delegate_vesting_shares':
                    case 'delete_comment':
                    case 'fill_order':
                    case 'feed_publish':
                    case 'fill_vesting_withdraw':
                    case 'pow2':
                    case 'recover_account':
                    case 'request_account_recovery':
                    case 'set_withdraw_vesting_route':
                    case 'transfer':
                    case 'transfer_from_savings':
                    case 'transfer_to_savings':
                    case 'transfer_to_vesting':
                    case 'escrow_approve':
                    case 'escrow_dispute':
                    case 'escrow_release':
                    case 'escrow_transfer':
                    case 'convert':
                    case 'fill_convert_request':
                    case 'interest':
                    case 'limit_order_cancel':
                    case 'limit_order_create':
                    case 'shutdown_witness':
                    case 'witness_update':
                    case 'comment_options':
                    case 'claim_account':
                    case 'create_claimed_account':
                    case 'witness_set_properties':
                    default:
                        console.log('NOT_OPERATABLE -' + operation[0]);
                        break;
                }
            }
        }
    }
};

module.exports = {
    parseSwitcher
};