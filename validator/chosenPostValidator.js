const { App } = require('models');
const _ = require('lodash');

const VALIDATE_BODY_REGEX = /^#(daily|weekly) @[a-zA-Z]{3,}/;

// add roles to this variable(separate with "," ex: 'admins,moderators,copywriters')
// to make them responsible for chosen posts.
// role must be string or array of strings, not objects
const RESPONSIBLE_USER_ROLES = 'admins'.split(',');

const checkBody = (body) => VALIDATE_BODY_REGEX.test(body);

const validateApp = async (name) => {
  const { app, error } = await App.getOne({ name });
  return !!app && !error;
};

const validateResponsibleUser = async ({ app_name: appName, user_name: userName }) => {
  const { app, error } = await App.getOne({ name: appName });
  if (error) {
    return false;
  }
  const respUsers = [];
  _.forEach(app, (value, key) => {
    if (RESPONSIBLE_USER_ROLES.includes(key)) respUsers.push(..._.flatten(value));
  });

  return respUsers.includes(userName);
};

module.exports = { checkBody, validateApp, validateResponsibleUser };
