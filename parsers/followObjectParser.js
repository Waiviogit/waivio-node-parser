const _ = require('lodash');
const { User, Wobj, wobjectSubscriptions } = require('models');
const { userHelper } = require('utilities/helpers');

const parse = async (data) => {
  let json;

  try {
    json = JSON.parse(data.json);
  } catch (error) {
    console.error(error);
    return (error);
  }
  // check author of operation and user which will be updated
  if (_.get(data, 'required_posting_auths[0]') !== _.get(json, '[1].user') && _.get(data, 'required_auths[0]') !== _.get(json, '[1].user')) {
    console.error('Can\'t follow, follower and author of operation are different');
    return;
  }
  if (json && json[0] === 'follow' && json[1] && json[1].user && json[1].author_permlink && json[1].what) {
    if (json[1].what.length) { // if field what present - it's follow on object
      const { wobject, error } = await Wobj.getOne({ author_permlink: json[1].author_permlink });
      if (!wobject || error) {
        const resultMessage = error || `User ${json[1].user} try to follow non existing wobject: ${json[1].author_permlink}`;
        console.log(resultMessage);
        return (resultMessage);
      }
      await userHelper.checkAndCreateUser(json[1].user);
      const { result } = await User.addObjectFollow(json[1]);
      await wobjectSubscriptions
        .followWobject({ follower: json[1].user, following: json[1].author_permlink });
      if (result) {
        const resultMessage = `User ${json[1].user} now following wobject ${json[1].author_permlink}!\n`;
        console.log(resultMessage);
        return resultMessage;
      }
    } else { // else if missing - unfollow
      const { result } = await User.removeObjectFollow(json[1]);
      await wobjectSubscriptions
        .unfollowWobject({ follower: json[1].user, following: json[1].author_permlink });
      if (result) {
        const resultMessage = `User ${json[1].user} now unfollow wobject ${json[1].author_permlink} !\n`;
        console.log(resultMessage);
        return resultMessage;
      }
    }
  }
};

module.exports = { parse };
