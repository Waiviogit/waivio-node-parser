/* eslint-disable camelcase */
const { Delegation } = require('database').models;

const createOne = async ({
  delegator, delegatee, vesting_shares = '', delegation_date,
}) => {
  try {
    const vestingSharesParsed = parseFloat(
      vesting_shares
        .replace(/VESTS/, '')
        .trim(),
    );

    if (!vestingSharesParsed) {
      const result = await Delegation.deleteOne({
        delegator,
        delegatee,
      });

      return { result };
    }

    const result = await Delegation.create({
      delegator,
      delegatee,
      vesting_shares: vestingSharesParsed,
      delegation_date,
    });

    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  createOne,
};
