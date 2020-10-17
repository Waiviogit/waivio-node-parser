const _ = require('lodash');
const { App } = require('models');
const config = require('config');

exports.validate = async (name, type) => {
  const { result, error } = await App.findOne({ host: config.appHost });
  if (error) return true;
  return !!_.find(result.service_bots, (bot) => bot.name === name && _.includes(bot.roles, type));
};
