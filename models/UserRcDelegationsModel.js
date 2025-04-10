const { UserRcDelegations } = require('database').models;

const deleteMany = async ({ filter, options }) => {
  try {
    const result = await UserRcDelegations.deleteMany(filter, options);
    return { result };
  } catch (error) {
    return { error };
  }
};

const updateOne = async ({ filter, update, options }) => {
  try {
    const result = await UserRcDelegations.updateOne(filter, update, options);
    return { result };
  } catch (error) {
    return { error };
  }
};

const updateRc = async ({ delegator, delegatee, rc }) => updateOne({
  filter: { delegator, delegatee },
  update: { rc },
  options: { upsert: true },
});

const removeDelegations = async ({ delegator, delegatees }) => deleteMany({
  filter: { delegator, delegatee: { $in: delegatees } },
});

module.exports = {
  deleteMany,
  updateOne,
  removeDelegations,
  updateRc,
};
