const { App } = require('../models');

const VALIDATE_BODY_REGEX = /^#(daily|weekly) @[a-zA-Z]{3,}/;
const RESPONSIBLE_USER_ROLE = 'admin';

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
  const respUser = app[RESPONSIBLE_USER_ROLE];
  return userName === respUser;
};

module.exports = { checkBody, validateApp, validateResponsibleUser };
