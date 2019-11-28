const { dropDatabase, redis } = require( './testHelper' );

beforeEach( async () => {
    process.env.NODE_ENV = 'test';
    await dropDatabase();
    await redis.postRefsClient.flushdbAsync();
} );
