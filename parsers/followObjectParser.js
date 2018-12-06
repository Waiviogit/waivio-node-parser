const {Wobj} = require('../models');

const followObject = async function (data) {
    let json;
    try {
        json = JSON.parse(data.json);
    } catch (error) {
        console.log(error);
        return;
    }
    if (json && json.follow && json.follow.user && json.follow.author_permlink) {
        if (json.follow.what) {
            const {error} = await Wobj.addFollower(json.follow);
            if (error) {
                console.log(error);
            }
            console.log(`User ${json.follow.user} now following wobject ${json.follow.author_permlink}!\n`);
        } else if (json.follow.what === ''){
            const {error} = await Wobj.removeFollower(json.follow);
            if(error){
                console.log(error);
            }
            console.log(`User ${json.follow.user} now unfollow wobject ${json.follow.author_permlink} !\n`);
        }
    }
};

module.exports = {followObject};