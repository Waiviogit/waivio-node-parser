const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {type: String, index: true, unique: true},
    profile_image: {type: String},
    w_objects:
        {
            type:
                [{
                    author_permlink: {type: String, index: true},
                    weight: {type: Number, default: 1},  //Object Shares, value in STEEM(or WVIO) coin
                    rank: {type: Number, default: 1}     //Object Expertise, value from 1 to 99
                }],
            default: []
        },
    read_locales: {type: [String], default: []},
    objects_follow: {type: [String], default: []} //arr of author_permlink of objects what user following
}, {timestamps: true});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;