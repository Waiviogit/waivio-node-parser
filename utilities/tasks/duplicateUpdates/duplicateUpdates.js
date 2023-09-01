const { WObject } = require('database').models;

const duplicateUpdates = async () => {
  try {
    const objects = WObject.find({ object_type: 'product' });
    for await (const object of objects) {
      for (const field of object.fields) {
        for (const vote of field.active_votes) {
          const duplicate = field.active_votes
            .find((v) => v.voter === vote.voter && v.percent && v._id !== vote._id);
          if (duplicate) {
            duplicate.weightWAIV = vote.weightWAIV;
            field.active_votes = field.active_votes.filter((v) => v._id !== vote._id);
            await object.save();
            console.log(`saved  ${object.author_permlink}`);
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = duplicateUpdates;
