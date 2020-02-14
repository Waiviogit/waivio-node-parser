const followObjectParser = require('parsers/followObjectParser');
const userParsers = require('parsers/userParsers');
const { ratingHelper } = require('utilities/helpers');
const { customJsonOperations } = require('utilities/guestOperations');

exports.parse = async (operation) => {
  switch (operation.id) {
    case 'follow_wobject':
      await followObjectParser.parse(operation);
      break;
    case 'wobj_rating':
      await ratingHelper.parse(operation);
      break;
    case 'follow':
      await userParsers.followUserParser(operation);
      break;

      // guests operations below //
    case 'waivio_guest_update':
      // waivio_guest_update
      break;
    case 'waivio_guest_vote':
      await customJsonOperations.guestVote(operation);
      break;
    case 'waivio_guest_follow':
      await customJsonOperations.followUser(operation);
      break;
    case 'waivio_guest_follow_wobject':
      await customJsonOperations.followWobject(operation);
      break;
    case 'waivio_guest_reblog':
      await customJsonOperations.reblogPost(operation);
      break;
    case 'waivio_guest_account_update':
      await customJsonOperations.accountUpdate(operation);
      break;
  }
};
