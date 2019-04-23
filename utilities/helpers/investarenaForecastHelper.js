const { Post } = require( '../../models' );
const { postsUtil } = require( '../steemApi' );
const SUPPORTED_EXP_FORECAST_BOTS = 'z1wo5,et42k,suy38,x45ki,q13lp,j5gs7,q1w2c,no58s,mhg41,b23df,vp4g5,an98r,npo31,w1c6c,nn13b'.split( ',' );

const updatePostWithForecast = async ( { author, permlink, forecast } ) => {
    const existing = await Post.findOne( { author: author, permlink: permlink } );
    let post = { author, permlink };

    if ( !existing.post ) {
        let { post: steemPost, err } = await postsUtil.getPost( author, permlink );

        if ( err ) {
            return { error: err };
        }
        post = steemPost;
    }
    post.forecast = forecast;

    const { result, error } = await Post.update( post );

    if ( error ) {
        return { error };
    }
    return { result };
};

const updatePostWithExpForecast = async ( { parent_author, parent_permlink, author, exp_forecast } ) => {
    const isValid = await validateExpForecast( { parent_permlink, parent_author, author, exp_forecast } );

    if ( isValid ) {
        const { result } = await Post.update( { author: parent_author, permlink: parent_permlink, exp_forecast } );

        if ( result ) {
            return true;
        }
    }
    return false;
};

const validateExpForecast = async ( { parent_author, parent_permlink, author, exp_forecast } ) => {
    const { post } = await Post.findOne( { author: parent_author, permlink: parent_permlink } );

    if ( !post || !post.forecast ) {
        return false;
    }
    if ( !SUPPORTED_EXP_FORECAST_BOTS.includes( author ) ) {
        return false;
    }
    if ( !exp_forecast ) {
        return false;
    }
    return true;
};

module.exports = { updatePostWithForecast, updatePostWithExpForecast };
