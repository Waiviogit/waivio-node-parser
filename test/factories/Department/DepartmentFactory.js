const { Department, faker } = require('test/testHelper');

const Create = async ({ name, related, objectsCount } = {}) => {
  const data = {
    name: name || faker.random.string(),
    related: related || [],
    objectsCount: objectsCount || 0,
  };

  const department = new Department(data);
  await department.save();

  return department.toObject();
};

module.exports = { Create };
