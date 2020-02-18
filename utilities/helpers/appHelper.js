const _ = require('lodash');
const { App } = require('models');
const { getAppData } = require('constants/appData');
const config = require('config');

const checkAppBlacklistValidity = async (metadata) => {
  // get current app (app from comment)
  let checkApp = _.get(metadata, 'app');
  if (!checkApp || typeof checkApp !== 'string') return true;
  [checkApp] = checkApp.split('/');

  // get current "Running" app
  const { app, error } = await App.getOne({ name: (getAppData()).appName });
  if (error) return true;

  const re = new RegExp(`^${checkApp}$`, 'i');
  const ignoredApps = _.chain(app).get('blacklists.apps').filter((x) => x.match(re)).value();

  return _.isEmpty(ignoredApps);
};

const getBlackListUsers = async () => {
  const { app } = await App.getOne({ name: config.app });
  if (!app) return { error: { message: 'App not find!' } };
  return { users: app.black_list_users };
};

const getProxyBots = async () => {
  const { app } = await App.getOne({ name: config.app });
  if (!app) return ['asd09'];
  const proxyBots = _.reduce(app.service_bots, (acc, item) => {
    if (_.includes(item.roles, 'proxyBot')) acc.push(item.name);
    return acc;
  }, []);
  if (proxyBots.length) return proxyBots;
  return ['asd09'];
};

module.exports = { checkAppBlacklistValidity, getBlackListUsers, getProxyBots };
