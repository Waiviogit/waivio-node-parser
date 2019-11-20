const { dropDatabase, redis } = require( './testHelper' );

before( async () => {
    process.env.NODE_ENV = 'test';
    await dropDatabase();
    await redis.postRefsClient.flushdbAsync();
} );
