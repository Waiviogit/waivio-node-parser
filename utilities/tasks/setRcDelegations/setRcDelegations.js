const { User } = require('database').models;
const { UserRcDelegationsModel } = require('models');
const moment = require('moment');
const { setTimeout } = require('timers/promises');

const setUserProcessed = async (name) => User.updateOne(
  { name },
  { $set: { processed: true } },
);

const getDelegatedRc = async (user) => {
  try {
    const response = await fetch('https://api.hive.blog/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 10,
        jsonrpc: '2.0',
        method: 'rc_api.list_rc_direct_delegations',
        params: {
          start: [user, ''],
          limit: 1000,
        },
      }),
    });

    const data = await response.json();

    return { result: data.result };
  } catch (error) {
    return { error };
  }
};

const setRcDelegations = async () => {
  const users = User.find(
    { processed: false },
    {
      name: 1,
      lastActivity: 1,
    },
  );

  const approximateForkRcDate = moment('2024-09-01');

  for await (const user of users) {
    if (!user.lastActivity) {
      await setUserProcessed(user.name);
      continue;
    }
    if (moment(user.lastActivity).isBefore(approximateForkRcDate)) {
      await setUserProcessed(user.name);
      continue;
    }

    const { result, error } = await getDelegatedRc(user.name);
    if (error) {
      continue;
    }

    const delegations = result?.rc_direct_delegations ?? [];

    for (const delegation of delegations) {
      await UserRcDelegationsModel.updateRc({
        delegator: user.name,
        delegatee: delegation.to,
        rc: delegation.delegated_rc,
      });
    }

    await setTimeout(200);
  }
};

module.exports = setRcDelegations;
