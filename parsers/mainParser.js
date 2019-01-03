const _ = require('lodash');
const {followObjectParser} = require('../parsers');
const {commentParser} = require('../parsers');
const {voteParser} = require('../parsers');

const parseSwitcher = transactions => {
    const {api} = require('../api');
    _.forEach(transactions, transaction => {
        if (transaction && transaction.operations && transaction.operations[0]) {
            _.forEach(transaction.operations, operation => {
                // console.log(operation[0]);
                // console.log(operation[1]);
                switch (operation[0]) {
                    case 'account_create':
                    case 'account_create_with_delegation':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['creator'])
                        // update_accounts_full.add(op['new_account_name'])
                        break;
                    case 'account_update':
                    case 'withdraw_vesting':
                    case 'claim_reward_balance':
                    case 'return_vesting_delegation':
                    case 'account_witness_vote':
                        // console.log(operation[0]);
                        //update_accounts_light.add(op['account']);
                        break;
                    case 'account_witness_proxy':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['account'])
                        // update_accounts_light.add(op['proxy'])
                        break;
                    case 'author_reward':
                    case 'comment':
                        commentParser.parse(operation[1]);
                        break;
                    case 'vote':
                        voteParser.parse(operation[1]);
                        // console.log(operation[1]);
                        // update_accounts_light.add(op['voter'])
                        // update_comments.add(construct_identifier())
                        break;
                    case 'cancel_transfer_from_savings':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['from'])
                        break;
                    case 'change_recovery_account':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['account_to_recover'])
                        break;
                    case 'comment_benefactor_reward':
                        // console.log(operation[0]);
                        // console.log(transaction.operations[0][1]);
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['benefactor'])
                        break;
                    case 'curation_reward':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['curator'])
                        break;
                    case 'custom':
                    case 'custom_json':
                        if (operation[1].id && operation[1].id === 'follow_wobject') {
                            followObjectParser.parse(operation[1]);
                        }
                        break;
                    case 'delegate_vesting_shares':
                        // console.log(operation[0]);
                        //     update_accounts_light.add(op['delegator'])
                        //     update_accounts_light.add(op['delegatee'])
                        break;
                    case 'delete_comment':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['author'])
                        break;
                    case 'fill_order':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['open_owner'])
                        // update_accounts_light.add(op['current_owner'])
                        break;
                    case 'feed_publish':
                        // console.log(operation[0]);
                        // console.log(transaction.operations[0][1]);
                        // update_accounts_light.add(op['publisher'])
                        break;
                    case 'fill_vesting_withdraw':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['to_account'])
                        // update_accounts_light.add(op['from_account'])
                        break;
                    case 'pow2':
                        // console.log(operation[0]);
                        // acc = op['work'][1]['input']['worker_account']
                        // update_accounts_light.add(acc)
                        break;
                    case 'recover_account':
                    case 'request_account_recovery':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['account_to_recover'])
                        break;
                    case 'set_withdraw_vesting_route':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['from_account'])
                        // update_accounts_light.add(op['to_account'])
                        break;
                    case 'transfer':
                    case 'transfer_from_savings':
                    case 'transfer_to_savings':
                    case 'transfer_to_vesting':
                        // console.log(operation[0]);
                        // accs = keep_in_dict(op, ['agent', 'from', 'to', 'who', 'receiver']).values()
                        // update_accounts_light.update(accs)
                        break;
                    case 'escrow_approve':
                    case 'escrow_dispute':
                    case 'escrow_release':
                    case 'escrow_transfer':
                        // console.log(operation[0]);
                        // accs = keep_in_dict(op, ['agent', 'from', 'to', 'who', 'receiver']).values()
                        // update_accounts_light.update(accs)
                        break;
                    case 'convert':
                    case 'fill_convert_request':
                    case 'interest':
                    case 'limit_order_cancel':
                    case 'limit_order_create':
                    case 'shutdown_witness':
                    case 'witness_update':
                        // console.log(operation[0]);
                        // update_accounts_light.add(op['owner'])
                        break;
                    case 'comment_options':
                        // console.log(operation[0]);
                        // console.log(transaction.operations[0][1]);
                        // console.log(operation[0]);
                        // console.log(transaction.operations[0][1])
                        //not operated
                        break;
                    case 'claim_account':
                        //not operated
                        break;
                    case 'create_claimed_account':
                        //not operated
                        break;
                    case 'witness_set_properties':
                        //not operated
                        break;
                    default:
                        console.log('NOT_OPERATABLE -' + operation[0]);
                        break;
                }
            })
        }
    });
};

module.exports = {
    parseSwitcher
};