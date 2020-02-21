const { client } = require('./createClient');

const getUser = async (accountName) => {
  try {
    const [user] = await client.database.getAccounts([accountName]);
    return { user };
  } catch (error) {
    return { error };
  }
};

const getUsers = async (accountNames) => {
  try {
    const users = await client.database.getAccounts(accountNames);
    return { users };
  } catch (error) {
    return { error };
  }
};

module.exports = { getUser, getUsers };
