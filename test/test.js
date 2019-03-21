const {Mongoose, redis} = require('./testHelper');

before(async () => {
    await Mongoose.connection.dropDatabase();
    await redis.tagsClient.flushdbAsync();
    await redis.postRefsClient.flushdbAsync();
});

// describe('Array', function () {
//     describe('equal array', function () {
//         it('should success if array is equal', function () {
//             expect([1, 2, 3]).to.deep.equal([1, 2, 3])
//         });
//     });
// });
