const { Delegation } = require('database').models;

const formatDecimal = (number) => (+(number / 1e6).toFixed(6));

const fix = async () => {
  try {
    const delegations = Delegation.find().lean();

    for await (const delegation of delegations) {
      await Delegation.updateOne(
        { _id: delegation._id },
        { vesting_shares: formatDecimal(delegation.vesting_shares) },
      );
    }

    console.log('task completed');
  } catch (error) {
    console.log(error.message);
  }
};

(async () => {
  await fix();
  process.exit();
})();
