const followObjectParser = require('parsers/followObjectParser');
const userParsers = require('parsers/userParsers');
const { ratingHelper, userHelper } = require('utilities/helpers');
const { customJsonOperations } = require('utilities/guestOperations');
const { CUSTOM_JSON_OPS } = require('constants/parsersData');

exports.parse = async (operation) => {
  switch (operation.id) {
    case CUSTOM_JSON_OPS.REJECT_REFERRAL_LICENCE:
      await userHelper.rejectReferralStatus(operation);
      break;
    case CUSTOM_JSON_OPS.CONFIRM_REFERRAL_LICENCE:
      await userHelper.confirmReferralStatus(operation);
      break;
    case CUSTOM_JSON_OPS.ADD_REFERRAL_AGENT:
      await userHelper.checkAndSetReferral(operation);
      break;
    case CUSTOM_JSON_OPS.FOLLOW_WOBJECT:
      await followObjectParser.parse(operation);
      break;
    case CUSTOM_JSON_OPS.WOBJ_RATING:
      await ratingHelper.parse(operation);
      break;
    case CUSTOM_JSON_OPS.FOLLOW:
      await userParsers.followUserParser(operation);
      break;
    case CUSTOM_JSON_OPS.BELL_NOTIFICATIONS:
      await userParsers.subscribeNotificationsParser(operation);
      break;
      // guests operations below //
    case CUSTOM_JSON_OPS.WAIVIO_GUEST_UPDATE:
      // waivio_guest_update
      break;
    case CUSTOM_JSON_OPS.WAIVIO_GUEST_VOTE:
      await customJsonOperations.guestVote(operation);
      break;
    case CUSTOM_JSON_OPS.WAIVIO_GUEST_FOLLOW:
      await customJsonOperations.followUser(operation);
      break;
    case CUSTOM_JSON_OPS.WAIVIO_GUEST_FOLLOW_WOBJECT:
      await customJsonOperations.followWobject(operation);
      break;
    case CUSTOM_JSON_OPS.WAIVIO_GUEST_REBLOG:
      await customJsonOperations.reblogPost(operation);
      break;
    case CUSTOM_JSON_OPS.WAIVIO_GUEST_ACCOUNT_UPDATE:
      await customJsonOperations.accountUpdate(operation);
      break;
    case CUSTOM_JSON_OPS.WAIVIO_GUEST_BELL:
      await customJsonOperations.subscribeNotification(operation);
      break;
  }
};
