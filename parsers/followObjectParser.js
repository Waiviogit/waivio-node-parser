const _ = require('lodash');
const { ERROR } = require('constants/common');
const { userHelper } = require('utilities/helpers');
const { Wobj, wobjectSubscriptions } = require('models');
const jsonHelper = require('utilities/helpers/jsonHelper');
const customJsonHelper = require('utilities/helpers/customJsonHelper');

const parse = async (data) => {
  const json = jsonHelper.parseJson(data.json);
  if (_.isEmpty(json)) return console.error(ERROR.INVALID_JSON);
  // check author of operation and user which will be updated
  if (customJsonHelper.getTransactionAccount(data) !== _.get(json, '[1].user')) {
    console.error(ERROR.FOLLOW_OBJECT_PARSER);
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
      await wobjectSubscriptions
        .followWobject({ follower: json[1].user, following: json[1].author_permlink });
    } else { // else if missing - unfollow
      await wobjectSubscriptions
        .unfollowWobject({ follower: json[1].user, following: json[1].author_permlink });
    }
  }
};

module.exports = { parse };
