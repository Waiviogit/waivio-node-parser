const { User, Delegation } = require('database').models;
const redisGetter = require('utilities/redis/redisGetter');
const redisSetter = require('utilities/redis/redisSetter');

const userUtil = require('utilities/steemApi/usersUtil');

const REDIS_LAST_ID = 'last_id_delegation_task';
const REDIS_LAST_ID_COMPLETED = 'last_id_delegation_task_completed';
const MAX_USERS = 100;

const formatDecimal = (number) => (+(number / 1e6).toFixed(6));

const addDelegations = async (name) => {
  const delegations = await userUtil.getDelegations(name);
  if (delegations?.error) {
    console.log('error get delegations for ', name);
    return;
  }
  if (!delegations.length) return;

  const bulkOps = delegations.map((delegation) => ({
    delegator: delegation.delegator,
    delegatee: delegation.delegatee,
    vesting_shares: formatDecimal(+delegation.vesting_shares.amount),
    delegation_date: delegation.min_delegation_time,
  }));

  for (const bulkOp of bulkOps) {
    try {
      await Delegation.create(bulkOp);
    } catch (error) {
      continue;
    }
  }
};
const getLastId = async () => {
  const id = await redisGetter.getAsync({ key: REDIS_LAST_ID });
  if (id) return id;
  const user = await User.findOne({}, { name: 1 }).lean();

  const userId = user._id.toString();

  await redisSetter.set({ key: REDIS_LAST_ID, value: userId });
  await addDelegations(user.name);

  return userId;
};

let usersProcessed = 0;

module.exports = async () => {
  try {
    let id = await getLastId();
    const finished = await redisGetter.getAsync({ key: REDIS_LAST_ID_COMPLETED });
    if (finished) {
      console.log('task completed');
      return;
    }

    while (true) {
      const users = await User.find({ _id: { $gt: id } }, { name: 1 }, { limit: MAX_USERS }).lean();
      if (!users.length) {
        await redisSetter.set({ key: REDIS_LAST_ID_COMPLETED, value: 'true' });
        break;
      }
      id = users[users.length - 1]._id.toString();

      for (const user of users) {
        await addDelegations(user.name);
        await redisSetter.set({ key: REDIS_LAST_ID, value: user._id.toString() });
      }
      usersProcessed += users.length;
      console.log('usersProcessed', usersProcessed);
      console.log('lastId', id);
    }

    console.log('task completed');
  } catch (error) {
    console.log(error.message);
  }
};
