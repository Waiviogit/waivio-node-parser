const { Signature } = require('@hiveio/dhive');
const crypto = require('crypto');
const jsonHelper = require('utilities/helpers/jsonHelper');
const customJsonHelper = require('utilities/helpers/customJsonHelper');
const _ = require('lodash');
const { VERIFY_SIGNATURE_TYPE, CUSTOM_JSON_OPS } = require('constants/parsersData');
const { usersUtil } = require('utilities/steemApi');
const redisSetter = require('utilities/redis/redisSetter');
const redisGetter = require('utilities/redis/redisGetter');
const config = require('config');

const BLOCK_TRANSITION_TO_SIGNATURE = 84146832;

const guestAccountById = {
  [CUSTOM_JSON_OPS.WEBSITE_GUEST]: (payload) => payload.userName,
  [CUSTOM_JSON_OPS.GUEST_HIDE_COMMENT]: (payload) => payload.guestName,
  [CUSTOM_JSON_OPS.GUEST_HIDE_POST]: (payload) => payload.guestName,
  [CUSTOM_JSON_OPS.WOBJ_RATING_GUEST]: (payload) => payload.guestName,
  [CUSTOM_JSON_OPS.WAIVIO_GUEST_BELL]: (payload) => _.get(payload, '[1].follower'),
  [CUSTOM_JSON_OPS.WAIVIO_GUEST_ACCOUNT_UPDATE]: (payload) => payload.account,
  [CUSTOM_JSON_OPS.WAIVIO_GUEST_REBLOG]: (payload) => _.get(payload, '[1].account'),
  [CUSTOM_JSON_OPS.WAIVIO_GUEST_FOLLOW_WOBJECT]: (payload) => _.get(payload, '[1].user'),
  [CUSTOM_JSON_OPS.WAIVIO_GUEST_FOLLOW]: (payload) => _.get(payload, '[1].follower'),
  [CUSTOM_JSON_OPS.WAIVIO_GUEST_VOTE]: (payload) => payload.voter,
  default: () => '',
};

const getFromCustomJson = (operation) => {
  const account = customJsonHelper.getTransactionAccount(operation);
  const payload = jsonHelper.parseJson(operation.json, {});
  const isArray = Array.isArray(payload);

  const signature = isArray
    ? payload[payload.length - 1]
    : payload.signature;

  const jsonWithoutSignature = isArray
    ? payload.slice(0, payload.length - 1)
    : _.omit(payload, 'signature');

  const message = JSON.stringify({
    account, id: operation.id, json: JSON.stringify(jsonWithoutSignature),
  });

  const guestAccount = (guestAccountById[operation.id] || guestAccountById.default)(payload);

  const [signer] = guestAccount.split('_');

  return { message, signature, signer };
};

const getFromComment = (operation) => {
  const { author, permlink } = operation;
  const payload = jsonHelper.parseJson(operation.json_metadata, {});
  const { signature } = payload;
  const message = JSON.stringify({ author, permlink });
  const guestAccount = payload.comment.userId;

  const [signer] = guestAccount.split('_');

  return { message, signature, signer };
};

const getFromCommentObjects = (operation) => {
  const { author, permlink } = operation;
  const payload = jsonHelper.parseJson(operation.json_metadata, {});
  const { signedTrx } = payload;
  if (!signedTrx) return { message: '', signature: '', signer: '' };
  const message = JSON.stringify({ author, permlink });

  const { signature, signer } = signedTrx;

  return { message, signature, signer };
};

const getSignatureAndSigner = {
  [VERIFY_SIGNATURE_TYPE.CUSTOM_JSON]: getFromCustomJson,
  [VERIFY_SIGNATURE_TYPE.COMMENT]: getFromComment,
  [VERIFY_SIGNATURE_TYPE.COMMENT_OBJECTS]: getFromCommentObjects,
  default: () => ({ message: '', signature: '', signer: '' }),
};

const getSignerPubKey = async (name) => {
  const key = `pub_memo_key:${name}`;
  const cache = await redisGetter.getAsync({ key });
  if (cache) return cache;

  const { user, error } = await usersUtil.getUser(name);
  if (error) return '';

  const result = user.memo_key;
  await redisSetter.setEx({
    key, value: result, ttlSeconds: 60 * 10,
  });
  return result;
};

const verifySignature = async ({ operation, type }) => {
  try {
    const blockNum = await redisGetter.getLastBlockNum();
    if (blockNum < BLOCK_TRANSITION_TO_SIGNATURE) return true;
    const {
      message,
      signature,
      signer,
    } = (getSignatureAndSigner[type] || getSignatureAndSigner.default)(operation);

    if (!message || !signature || !signer) return false;

    const hashedMessage = crypto.createHash('sha256').update(message).digest();

    const signatureObj = Signature.fromString(signature);

    const pubKeyObj = signatureObj.recover(hashedMessage);
    const pubKey = pubKeyObj.toString();

    const signerPubKey = await getSignerPubKey(signer);
    if (!signerPubKey) return false;

    return pubKey === signerPubKey;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const verifyObjectsAction = async ({ operation, metadata }) => {
  const validSignature = await verifySignature({
    operation, type: VERIFY_SIGNATURE_TYPE.COMMENT_OBJECTS,
  });
  const creatorOp = metadata?.wobj?.creator === operation.author;

  return validSignature || creatorOp;
};

module.exports = {
  verifySignature,
  verifyObjectsAction,
};
