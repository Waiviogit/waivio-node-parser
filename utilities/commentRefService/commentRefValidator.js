const { getCommentRef } = require('./commentRefGetter');

/**
 * Validate for compatibility with existing Ref(if it exists).
 * Return true if ref exist and with the same type, or not exist,
 * else if Ref exist and with not the same type - return false
 * @param path {String}
 * @param type {String}
 * @returns {Promise<boolean>}
 */
exports.isRefWithCorrectType = async (path, type) => {
  const existRef = await getCommentRef(path);
  return !existRef || existRef.type === type;
};
