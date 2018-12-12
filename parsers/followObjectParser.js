const {User} = require('../models');

const parse = async function (data) {
    let json;
    try {
        json = JSON.parse(data.json);
    } catch (error) {
        console.log(error);
        return;
    }
    if (json && json[0] === 'follow' && json[1] && json[1].user && json[1].author_permlink && json[1].what) {
        if (json[1].what.length) {
            const {result} = await User.addObjectFollow(json[1]);
            if (result) {
                console.log(`User ${json[1].user} now following wobject ${json[1].author_permlink}!\n`)
            }
        } else {
            const {result} = await User.removeObjectFollow(json[1]);
            if (result) {
                console.log(`User ${json[1].user} now unfollow wobject ${json[1].author_permlink} !\n`);
            }
        }
    }
};

module.exports = {parse};