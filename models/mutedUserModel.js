const { MutedUser } = require('database').models;

exports.muteUser = async ({ userName, mutedBy, mutedForApps }) => {
  try {
    return MutedUser
      .updateOne({ userName }, { $addToSet: { mutedBy, mutedForApps } }, { upsert: true });
  } catch (error) {
    return { error };
  }
};

exports.unmuteUser = async ({ userName, mutedBy, mutedForApps }) => {
  try {
    return MutedUser
      .updateOne({ userName }, { $pullAll: { mutedBy, mutedForApps } });
  } catch (error) {
    return { error };
  }
};

(async () => {
  await this.unmuteUser({ userName: 'flowmaster', mutedBy: ['2df'], mutedForApps: ['dfds', 'kokok'] });
  console.log('yo');
})();
