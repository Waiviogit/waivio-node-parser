const config = require('../config');
const mongoose = require('mongoose');
const URI = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;
mongoose.connect(URI, {useNewUrlParser: true, useFindAndModify: false})
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
        ObjectType: require('./schemas/ObjectTypeSchema')
    }
};
