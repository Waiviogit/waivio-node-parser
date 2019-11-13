const RedisKeyScanner = require( 'redis-key-scanner' );

const scanner = new RedisKeyScanner( {
    host: process.env.REDISCLOUD_URL || 'localhost',
    port: 6379,
    db: 1,
    pattern: '*_*',
    minIdle: 500,
    maxIdle: 1000
} );
let count = 0;
scanner.on( 'data', ( data ) => {
    console.log( data );
    count += 1;
} );
scanner.on( 'end', () => {
    // clean up
    console.log( count );
} );
