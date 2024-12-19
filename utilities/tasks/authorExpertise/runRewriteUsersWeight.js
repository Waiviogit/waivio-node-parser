const { UserExpertise, User } = require('database').models;

const rewriteUsersWeight = async () => {
  const users = User.find(
    { processed: false },
    {
      name: 1,
    },
  );

  for await (const user of users) {
    const summArr = await UserExpertise.aggregate([
      {
        $match: {
          user_name: user.name,
        },
      },
      {
        $group: {
          _id: null,
          sum: { $sum: '$weight' },
        },
      },
    ]);
    const weight = summArr?.[0]?.sum || 0;

    await User.updateOne(
      {
        name: user.name,
      },
      {
        $set: { wobjects_weight: weight, processed: true },
      },
    );
  }
};

(async () => {
  await rewriteUsersWeight();
  process.exit();
})();
