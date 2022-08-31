const { CampaignV2 } = require('database').models;

exports.findOne = async ({ filter, projection, options }) => {
  try {
    return { result: await CampaignV2.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};
