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
                        break;
                    case 'account_create_with_delegation':
                        break;
                    case 'account_update':
                        break;
                    case 'withdraw_vesting':
                        break;
                    case 'claim_reward_balance':
                        break;
                    case 'return_vesting_delegation':
                        break;
                    case 'account_witness_vote':
                        break;
                    case 'account_witness_proxy':
                        break;
                    case 'author_reward':
                        break;
                    case 'comment':
                        await commentParser.parse(operation[1]);
                        break;
                    case 'vote':
                        await voteParser.parse(operation[1]);
                        break;
                    case 'cancel_transfer_from_savings':
                        break;
                    case 'change_recovery_account':
                        break;
                    case 'comment_benefactor_reward':
                        break;
                    case 'curation_reward':
                        break;
                    case 'custom':
                        break;
                    case 'custom_json':
                        if (operation[1].id && operation[1].id === 'follow_wobject') {
                            await followObjectParser.parse(operation[1]);
                        }
                        break;
                    case 'delegate_vesting_shares':
                        break;
                    case 'delete_comment':
                        break;
                    case 'fill_order':
                        break;
                    case 'feed_publish':
                        break;
                    case 'fill_vesting_withdraw':
                        break;
                    case 'pow2':
                        break;
                    case 'recover_account':
                        break;
                    case 'request_account_recovery':
                        break;
                    case 'set_withdraw_vesting_route':
                        break;
                    case 'transfer':
                        break;
                    case 'transfer_from_savings':
                        break;
                    case 'transfer_to_savings':
                        break;
                    case 'transfer_to_vesting':
                        break;
                    case 'escrow_approve':
                        break;
                    case 'escrow_dispute':
                        break;
                    case 'escrow_release':
                        break;
                    case 'escrow_transfer':
                        break;
                    case 'convert':
                        break;
                    case 'fill_convert_request':
                        break;
                    case 'interest':
                        break;
                    case 'limit_order_cancel':
                        break;
                    case 'limit_order_create':
                        break;
                    case 'shutdown_witness':
                        break;
                    case 'witness_update':
                        break;
                    case 'comment_options':
                        break;
                    case 'claim_account':
                        break;
                    case 'create_claimed_account':
                        break;
                    case 'witness_set_properties':
                        break;
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