/* eslint-disable camelcase */
const { Wobj } = require('models');
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');

exports.parse = async (operation, metadata) => {
  const { author_permlink } = metadata.wobj;
  const {
    author, permlink, parent_author, parent_permlink,
  } = operation;
  if (!author_permlink) return;

  const { result, error } = await Wobj.update(
    { author_permlink },
    {
      $addToSet: { updateLinks: { parent_author: author, parent_permlink: permlink } },
      $set: { rootType: { author: parent_author, parent_permlink } },
    },
  );

  if (error || !result) {
    await sendSentryNotification();
    Sentry.captureException(error || operation);
  }
};
