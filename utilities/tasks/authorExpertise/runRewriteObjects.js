const { WObject, UserExpertise } = require('database').models;

const rewriteObjectsWeight = async () => {
  const objects = WObject.find(
    { processed: false },
    {
      author_permlink: 1,
    },
  );

  for await (const object of objects) {
    const summArr = await UserExpertise.aggregate([
      {
        $match: {
          author_permlink: object.author_permlink,
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

    await WObject.updateOne(
      {
        author_permlink: object.author_permlink,
      },
      {
        $set: { weight, processed: true },
      },
    );
  }
};

(async () => {
  await rewriteObjectsWeight();
  process.exit();
})();
