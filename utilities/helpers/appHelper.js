const _ = require('lodash');
const App = require('models/AppModel');
const config = require('config');

const checkAppBlacklistValidity = async (metadata) => {
  // get current app (app from comment)
  let checkApp = _.get(metadata, 'app');
  if (!checkApp || typeof checkApp !== 'string') return true;
  [checkApp] = checkApp.split('/');

  // get current "Running" app
  const { app, error } = await App.getOne({ name: process.env.APP_NAME || config.app });
  if (error) return true;

  const re = new RegExp(`^${checkApp}$`, 'i');
  const ignoredApps = _.chain(app).get('blacklists.apps').filter((x) => x.match(re)).value();

  return _.isEmpty(ignoredApps);
};

const getBlackListUsers = async () => {
  const { app } = await App.getOne({ name: config.app });
  if (!app) return { error: { message: 'App not found!' } };
  return { users: app.black_list_users, referralsData: app.referralsData };
};

const getProxyBots = async (roles) => {
  const { app } = await App.getOne({ name: config.app });
  if (!app) return [];
  const proxyBots = _.reduce(app.service_bots, (acc, item) => {
    if (_.intersection(item.roles, roles).length) acc.push(item.name);
    return acc;
  }, []);
  return proxyBots || [];
};

const getAppData = async (name) => App.getOne({ name });

module.exports = {
  checkAppBlacklistValidity, getBlackListUsers, getProxyBots, getAppData,
};
