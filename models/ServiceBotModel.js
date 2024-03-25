const { ServiceBot } = require('database').models;

const findOne = async ({ filter, projection, options }) => {
  try {
    const result = await ServiceBot.findOne(filter, projection, options).lean();

    return { result };
  } catch (error) {
    return { error };
  }
};

const findOneByNameAndRole = async ({ name, role }) => {
  const { result } = await findOne({ filter: { name, roles: role } });

  return result;
};

module.exports = {
  findOneByNameAndRole,
};
