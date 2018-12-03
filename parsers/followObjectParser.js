const {Wobj} = require('../models');

const followObject = async function (data) {
    const json = JSON.parse(data.json);
    if (json && json.follow && json.follow.user && json.follow.author_permlink) {
        const {error} = await Wobj.addFollower(json.follow);
        if (error) {
            console.log(error);
        }
        console.log(`User ${json.follow.user} now following wobject ${json.follow.author_permlink}!\n`);
    }
};

module.exports = {followObject};