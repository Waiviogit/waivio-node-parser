const { faker } = require('test/testHelper');
const { MUTE_ACTION } = require('constants/parsersData');
const _ = require('lodash');

exports.settingsData = ({
  author, appId, beneficiary, googleAnalyticsTag,
}) => {
  const data = {
    required_posting_auths: [author || faker.random.string()],
    json: {
      googleAnalyticsTag: googleAnalyticsTag || faker.random.string(),
      appId: appId || faker.random.string(),
    },
  };
  if (beneficiary) data.json.beneficiary = beneficiary;
  data.json = JSON.stringify(data.json);
  return data;
};

exports.authorityData = ({ author, host, names }) => ({
  required_posting_auths: [author || faker.random.string()],
  json: JSON.stringify({
    host: host || faker.random.string(),
    names: names || [faker.random.string()],
  }),
});

exports.mutedData = ({ sender, users, action } = {}) => ({
  required_posting_auths: [sender || faker.random.string()],
  json: JSON.stringify({
    users: users || [faker.random.string()],
    action: action || _.sample(Object.values(MUTE_ACTION)),
  }),
});
