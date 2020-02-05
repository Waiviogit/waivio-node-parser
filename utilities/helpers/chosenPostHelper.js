const _ = require('lodash');
const { App } = require('../../models');
const { postsUtil } = require('../steemApi');
const { chosenPostValidator } = require('../../validator');

const VALIDATE_BODY_REGEX = /^#(?<period>daily|weekly) @(?<app>[a-zA-Z]{3,})/;

const getAppFromBodyStr = (bodyStr) => {
  const result = bodyStr.match(VALIDATE_BODY_REGEX);
  return _.get(result, 'groups.app');
};

const getPeriodFromBodyStr = (bodyStr) => {
  const result = bodyStr.match(VALIDATE_BODY_REGEX);
  return _.get(result, 'groups.period');
};

const updateAppChosenPost = async (operation) => {
  const appName = getAppFromBodyStr(operation.body);
  const userName = operation.author;

  const isAppValid = await chosenPostValidator.validateApp(appName);
  const isRespUserValid = await chosenPostValidator.validateResponsibleUser({
    app_name: appName, user_name: userName,
  });
  if (!isAppValid || !isRespUserValid) {
    console.error(`Not valid select chosen post for operation: ${JSON.stringify(operation, null, 2)}`);
    return;
  }
  // get parent post to extract "title"
  const { post, err } = await postsUtil.getPost(operation.parent_author, operation.parent_permlink);
  if (err) {
    console.error(err);
    return;
  }
  const { app, error } = await App.updateChosenPost({
    name: appName,
    author: operation.parent_author,
    permlink: operation.parent_permlink,
    title: _.get(post, 'title', ''),
    period: getPeriodFromBodyStr(operation.body),
  });
  if (error) {
    return console.error(error);
  }
  console.log(`${userName} successfully update chosen post for app ${appName}!`);
};

module.exports = { getAppFromBodyStr, getPeriodFromBodyStr, updateAppChosenPost };
