const mongoose = require('mongoose');
const db = require('database');
const _ = require('lodash');

const DeletedCommentsSchema = new mongoose.Schema({
  author: { type: String },
  permlink: { type: String },
  processed: { type: Boolean },
});

const DeletedComments = mongoose.model('deleted_comments', DeletedCommentsSchema);

module.exports = async () => {
  let documentsCount = 1000;
  do {
    try {
      const comments = await DeletedComments
        .find({ processed: { $exists: false } }).limit(1000).lean();
      documentsCount = comments.length;
      const deleteArray = _.map(comments, (c) => ({ root_author: c.author, permlink: c.permlink }));

      await db.models.Post.deleteMany({ $or: deleteArray });
      await DeletedComments.updateMany({ _id: { $in: _.map(comments, '_id') } }, { processed: true });
    } catch (error) {
      console.error(error.message);
    }
  } while (documentsCount === 1000);

  console.log('task finished');
};
