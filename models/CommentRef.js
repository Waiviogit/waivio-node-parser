const { CommentRef } = require('database').models;
const { COMMENT_REF_TYPES } = require('utilities/constants');

const create = async (data) => {
  try {
    const commentRef = await CommentRef.findOneAndUpdate(
      { comment_path: data.comment_path },
      { ...data },
      { upsert: true, new: true },
    ).lean();
    return { commentRef };
  } catch (error) {
    return { error };
  }
};

exports.addPostRef = async ({ comment_path: commentPath, wobjects, guest_author: guestAuthor }) => {
  const data = { comment_path: commentPath, wobjects, type: COMMENT_REF_TYPES.postWithWobjects };
  if (guestAuthor) data.guest_author = guestAuthor;
  return create(data);
};

exports.addWobjRef = async ({ comment_path: commentPath, root_wobj: rootWobj }) => create({
  comment_path: commentPath, root_wobj: rootWobj, type: COMMENT_REF_TYPES.createWobj,
});

exports.addAppendRef = async ({ comment_path: commentPath, root_wobj: rootWobj }) => create({
  comment_path: commentPath, root_wobj: rootWobj, type: COMMENT_REF_TYPES.appendWobj,
});

exports.addWobjTypeRef = async ({ comment_path: commentPath, name }) => create({
  comment_path: commentPath, name, type: COMMENT_REF_TYPES.wobjType,
});

exports.getRef = async (commentPath) => {
  try {
    const commentRef = await CommentRef.findOne({ comment_path: commentPath }).lean();
    return { commentRef };
  } catch (error) {
    return { error };
  }
};

// const isExist = async (commentPath) => {
//   try {
//     const count = await CommentRef.find({ comment_path: commentPath }).count();
//     return !!count;
//   } catch (error) {
//     return false;
//   }
// };

exports.create = create;
