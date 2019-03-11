const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    id: {type: Number, required: true},
    author: {type: String},
    author_reputation: {type: Number},
    permlink: {type: String},
    parent_author: {type: String, default: ''},
    parent_permlink: {type: String, required: true},
    title: {type: String, required: true, default: ''},
    body: {type: String, required: true, default: ''},
    json_metadata: {type: String, required: true, default: ''},
    app: {type: String},
    depth: {type: Number, default: 0},
    category: {type: String},
    last_update: {type: String},
    created: {type: String},
    active: {type: String},
    last_payout: {type: String},
    children: {type: Number, default: 0},
    net_rshares: {type: Number, default: 0},
    abs_rshares: {type: Number, default: 0},
    vote_rshares: {type: Number, default: 0},
    children_abs_rshares: {type: Number, default: 0},
    cashout_time: {type: String},
    reward_weight: {type: String, default: 10000},
    total_payout_value: {type: String, default: '0.000 SBD'},
    curator_payout_value: {type: String, default: '0.000 SBD'},
    author_rewards: {type: Number, default: 0},
    net_votes: {type: Number, default: 0},
    root_author: {type: String},
    root_permlink: {type: String},
    root_title: {type: String},
    max_accepted_payout: {type: String},
    percent_steem_dollars: {type: Number, default: 0},
    allow_replies: {type: Boolean, default: true},
    allow_votes: {type: Boolean, default: true},
    allow_curation_rewards: {type: Boolean, default: true},
    beneficiaries: [{
        account: {type: String},
        weight: {type: Number}
    }],
    url: {type: String},
    pending_payout_value: {type: String},
    total_pending_payout_value: {type: String},
    total_vote_weight: {type: Number, default: 0},
    promoted: {type: String, default: '0.000 STEEM'},
    body_length: {type: Number, default: 0},
    active_votes: {
        type: [{
            voter: {type: String, required: true},
            weight: {type: Number, required: true},
            percent: {type: Number}
        }],
        default: []
    },
    wobjects: [{
        author_permlink: {type: String, index: true},
        percent: {type: Number},
        tagged: {type: String}
    }]
}, {timestamps: true});

PostSchema.index({author: 1, permlink: 1}, {unique: true});

const PostModel = mongoose.model('Post', PostSchema);

module.exports = PostModel;