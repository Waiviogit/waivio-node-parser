const {Mongoose, redis} = require('./testHelper');

before(async () => {
    process.env.NODE_ENV = 'test';
    await Mongoose.connection.dropDatabase();
    await redis.tagsClient.flushdbAsync();
    await redis.postRefsClient.flushdbAsync();
    await redis.importWobjectsDataClient.flushdbAsync();
});
