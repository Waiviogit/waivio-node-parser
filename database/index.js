const mongoose = require('mongoose');
const config = require('config');

const URI = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;

mongoose.connect(URI, {
  useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true,
})
  .then(() => console.log('connection successful!'))
  .catch((error) => console.error(error));

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

mongoose.Promise = global.Promise;

module.exports = {
  Mongoose: mongoose,
  models: {
    WObject: require('./schemas/wObjectSchema'),
    User: require('./schemas/UserSchema'),
    Post: require('./schemas/PostSchema'),
    ObjectType: require('./schemas/ObjectTypeSchema'),
    UserWobjects: require('./schemas/UserWobjectsSchema'),
    App: require('./schemas/AppSchema'),
    CommentRef: require('./schemas/CommentRefSchema'),
    Comment: require('./schemas/CommentSchema'),
    Subscriptions: require('./schemas/SubscriptionSchema'),
    Campaign: require('./schemas/CampaignSchema'),
    PaymentHistories: require('./schemas/PaymentHistoriesSchema'),
    WobjectSubscriptions: require('./schemas/WobjectSubscriptionSchema'),
    WebsitePayments: require('./schemas/WebsitePaymentsSchema'),
    WebsitesRefund: require('./schemas/WebsiteRefudSchema'),
    RelatedAlbum: require('./schemas/RelatedAlbumSchema'),
    HiddenPost: require('./schemas/HiddenPostSchema'),
    HiddenComment: require('./schemas/HiddenCommentSchema'),
    MutedUser: require('./schemas/MutedUserSchema'),
  },
};
