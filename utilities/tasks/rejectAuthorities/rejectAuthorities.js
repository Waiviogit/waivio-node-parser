const { WObject } = require('database').models;

const rejectAuthorities = async () => {
  try {
    const objects = WObject.find({ object_type: { $in: ['product', 'book'] } });

    for await (const object of objects) {
      const authorityPull = [];
      for (const authority of object?.authority?.administrative ?? []) {
        const field = object?.fields?.find((el) => el.creator === authority && el.name === 'authority' && el.body === 'administrative');
        if (field && field.weight < 0) {
          authorityPull.push(authority);
        }
      }
      if (authorityPull.length) {
        console.log(`pull ${authorityPull.toString()} for ${object.author_permlink}`);
        await WObject
          .updateOne({ _id: object._id }, { $pullAll: { 'authority.administrative': authorityPull } });
      }
    }
    console.log('TaskFinished');
  } catch (error) {
    console.log(error);
  }
};

module.exports = rejectAuthorities;
