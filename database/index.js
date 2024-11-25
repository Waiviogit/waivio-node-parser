const mongoose = require('mongoose');
const config = require('config');

mongoose.connect(config.mongoConnectionString)
  .then(() => console.log('connection successful!'))
  .catch((error) => console.error(error));

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
mongoose.connection.on('close', () => console.log(`closed ${config.db.database}`));

const closeMongoConnections = async () => {
  await mongoose.connection.close(false);
};

mongoose.Promise = global.Promise;

module.exports = {
  Mongoose: mongoose,
  closeMongoConnections,
  models: {
    WObject: require('./schemas/wObjectSchema'),
    User: require('./schemas/UserSchema'),
    UserExpertise: require('./schemas/UserExpertiseSchema'),
    Post: require('./schemas/PostSchema'),
    ObjectType: require('./schemas/ObjectTypeSchema'),
    UserWobjects: require('./schemas/UserWobjectsSchema'),
    App: require('./schemas/AppSchema'),
    CommentRef: require('./schemas/CommentRefSchema'),
    Comment: require('./schemas/CommentSchema'),
    Subscriptions: require('./schemas/SubscriptionSchema'),
    Campaign: require('./schemas/CampaignSchema'),
    CampaignV2: require('./schemas/CampaignV2Schema'),
    PaymentHistories: require('./schemas/PaymentHistoriesSchema'),
    WobjectSubscriptions: require('./schemas/WobjectSubscriptionSchema'),
    WebsitePayments: require('./schemas/WebsitePaymentsSchema'),
    WebsitesRefund: require('./schemas/WebsiteRefudSchema'),
    RelatedAlbum: require('./schemas/RelatedAlbumSchema'),
    HiddenPost: require('./schemas/HiddenPostSchema'),
    HiddenComment: require('./schemas/HiddenCommentSchema'),
    MutedUser: require('./schemas/MutedUserSchema'),
    AirdropWAIV: require('./schemas/AirdropWAIV'),
    EngineAccountHistory: require('./schemas/EngineAccountHistorySchema'),
    Department: require('./schemas/DepartmentSchema'),
    GuestWallet: require('./schemas/GuestWalletSchema'),
    UserShopDeselect: require('./schemas/UserShopDeselectSchema'),
    Threads: require('./schemas/ThreadsSchema'),
    Delegation: require('./schemas/DelegationSchema'),
    ServiceBot: require('./schemas/ServiceBotSchema'),
  },
};
