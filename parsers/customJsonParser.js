const followObjectParser = require('parsers/followObjectParser');
const userParsers = require('parsers/userParsers');
const { ratingHelper, userHelper, sitesHelper } = require('utilities/helpers');
const { customJsonOperations } = require('utilities/guestOperations');
const { CUSTOM_JSON_OPS } = require('constants/parsersData');

exports.parse = async (operation, blockNum) => {
  switch (operation.id) {
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
      /** REFERRAL OPERATIONS */
    case CUSTOM_JSON_OPS.REJECT_REFERRAL_LICENCE:
      await userHelper.rejectReferralStatus(operation);
      break;
    case CUSTOM_JSON_OPS.CONFIRM_REFERRAL_LICENCE:
      await userHelper.confirmReferralStatus(operation);
      break;
    case CUSTOM_JSON_OPS.ADD_REFERRAL_AGENT:
      await userHelper.checkAndSetReferral(operation);
      break;
      /** GUEST OPERATIONS */
    case CUSTOM_JSON_OPS.WAIVIO_GUEST_UPDATE:
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
      /** WEBSITES */
    case CUSTOM_JSON_OPS.CREATE_CUSTOM_WEBSITE:
      await sitesHelper.createWebsite(operation);
      break;
    case CUSTOM_JSON_OPS.DELETE_CUSTOM_WEBSITE:
      await sitesHelper.createWebsite(operation);
      break;
    case CUSTOM_JSON_OPS.ACTIVATE_CUSTOM_WEBSITE:
      await sitesHelper.activationActions(operation, true);
      break;
    case CUSTOM_JSON_OPS.SUSPEND_CUSTOM_WEBSITE:
      await sitesHelper.activationActions(operation, false);
      break;
    case CUSTOM_JSON_OPS.CUSTOM_WEBSITE_SETTINGS:
      await sitesHelper.saveWebsiteSettings(operation);
      break;
    case CUSTOM_JSON_OPS.WEBSITE_ADD_AUTHORITIES:
      await sitesHelper.websiteAuthorities(operation, 'authority', true);
      break;
    case CUSTOM_JSON_OPS.WEBSITE_REMOVE_AUTHORITIES:
      await sitesHelper.websiteAuthorities(operation, 'authority', false);
      break;
    case CUSTOM_JSON_OPS.WEBSITE_ADD_ADMINISTRATORS:
      await sitesHelper.websiteAuthorities(operation, 'admins', true);
      break;
    case CUSTOM_JSON_OPS.WEBSITE_REMOVE_ADMINISTRATORS:
      await sitesHelper.websiteAuthorities(operation, 'admins', false);
      break;
    case CUSTOM_JSON_OPS.WEBSITE_ADD_MODERATORS:
      await sitesHelper.websiteAuthorities(operation, 'moderators', true);
      break;
    case CUSTOM_JSON_OPS.WEBSITE_REMOVE_MODERATORS:
      await sitesHelper.websiteAuthorities(operation, 'moderators', false);
      break;
    case CUSTOM_JSON_OPS.WEBSITE_REFUND_REQUEST:
      await sitesHelper.refundRequest(operation, blockNum);
      break;
  }
};
