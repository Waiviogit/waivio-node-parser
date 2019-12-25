const RedisKeyScanner = require( 'redis-key-scanner' );
const config = require( '../../config' );
const { postRefsClient } = require( './redis' );
const { MIN_REDIS_REFS_IDLE_TIME_IN_SEC } = require( '../constants' );
const _ = require( 'lodash' );

/**
 * Delete unused redis CommentRefs
 * Get all redis keys by min idle time {MIN_REDIS_REFS_IDLE_TIME_IN_SEC} and delete from redis
 */
exports.deleteUnusedCommentRefs = () => {
    const unusedRefsScanner = new RedisKeyScanner( {
        host: process.env.REDISCLOUD_URL || 'localhost',
        port: 6379,
        db: config.redis.wobjectsRefs || 1,
        pattern: '*_*',
        minIdle: MIN_REDIS_REFS_IDLE_TIME_IN_SEC,
        limit: 1000000
    } );
    let deletedCount = 0;
    unusedRefsScanner.on( 'data', ( data ) => {
        let deleteResult;
        if( _.get( data, 'key' ) )
            deleteResult = postRefsClient.del( _.get( data, 'key' ) );
        if( deleteResult )
            deletedCount++;
    } );
    unusedRefsScanner.on( 'end', () => {
        // clean up
        console.log( `Unused Redis COMMENT_REFS deleted ${deletedCount} records!` );
    } );
};

