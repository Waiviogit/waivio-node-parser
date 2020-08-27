const { faker } = require('test/testHelper');

exports.getCustomJsonData = ({ postingAuth, id, json }) => ({
  required_auths: [],
  required_posting_auths: postingAuth || [],
  id: id || faker.random.string(),
  json: json || JSON.stringify({}),
});
