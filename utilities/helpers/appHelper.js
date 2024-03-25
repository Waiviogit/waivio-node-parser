const _ = require('lodash');
const App = require('models/AppModel');
const config = require('config');

const checkAppBlacklistValidity = async (metadata) => {
  // get current app (app from comment)
  let checkApp = _.get(metadata, 'app');
  if (!checkApp || typeof checkApp !== 'string') return true;
  [checkApp] = checkApp.split('/');

  // get current "Running" app
  const { result: app, error } = await App.findOne({ host: config.appHost });
  if (error) return true;

  const re = new RegExp(`^${checkApp}$`, 'i');
  const ignoredApps = _.chain(app).get('blacklist_apps').filter((x) => x.match(re)).value();

  return _.isEmpty(ignoredApps);
};

const getBlackListUsers = async () => {
  const { result: app } = await App.findOne({ host: config.appHost });
  if (!app) return { error: { message: 'App not found!' } };
  return { users: app.black_list_users, referralsData: app.referralsData };
};

const getAppData = async (host) => App.findOne({ host });

module.exports = {
  checkAppBlacklistValidity, getBlackListUsers, getAppData,
};
