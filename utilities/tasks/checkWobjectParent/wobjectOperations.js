const { WObject } = require('database').models;

const checkParent = async () => {
  const wObjects = await WObject.find().lean();
  for (const wObject of wObjects) {
    if (wObject.author_permlink === wObject.parent) {
      await WObject.updateOne({ _id: wObject._id }, { $set: { parent: '' } });
      console.log(`${wObject.author_permlink} was a parent to himself`);
    }
  }
  console.log('_____verification completed successfully!');
};

module.exports = { checkParent };
