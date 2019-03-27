const {Mongoose, redis} = require('./testHelper');

before(async () => {
    await Mongoose.connection.dropDatabase();
    await redis.tagsClient.flushdbAsync();
    await redis.postRefsClient.flushdbAsync();
});
