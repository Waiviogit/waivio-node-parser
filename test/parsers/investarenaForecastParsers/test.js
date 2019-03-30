const {Post, expect, sinon, investarenaForecastHelper} = require('../../testHelper');
const {getMocks} = require('./mocks');
const {postsUtil} = require('../../../utilities/steemApi');
const {PostFactory} = require('../../factories/')

describe('InvestArena forecast helper', async () => {
    describe('update post with Forecast', async () => {
        describe('when post exist in database', async () => {
            let existingPost;
            let forecastData;
            let updatedPost;
            let spy;
            before(async () => {
                const mocks = await getMocks();
                existingPost = mocks.existingPost;
                forecastData = mocks.forecastData;
                spy = sinon.spy(postsUtil, 'getPost');
                await investarenaForecastHelper.updatePostWithForecast({
                    author: existingPost.author,
                    permlink: existingPost.permlink,
                    forecast: forecastData.wia
                });
                updatedPost = await Post.findOne({author: existingPost.author, permlink: existingPost.permlink}).lean()
            });

            after(function () {
                spy.restore();
            });

            it('should exist post after updating', async () => {
                expect(updatedPost).to.exist;
            });

            it('should include field "forecast"', async () => {
                expect(updatedPost.forecast).to.exist;
            });

            it('should include all nested keys of forecast data', async () => {
                expect(updatedPost.forecast).to.have.all.keys(Object.keys(forecastData.wia))
            });

            it('should have equal forecast data with source forecast data', async () => {
                expect(updatedPost.forecast).to.deep.equal(forecastData.wia)
            });

            it('should not call requiest on steemit.api(postsUtil.getPost)', async () => {
                expect(spy.notCalled).to.be.true;
            });
        });

        describe('when post not exist in database', async () => {
            let newPost;
            let forecastData;
            let updatedPost;
            let stub;
            before(async () => {
                const mocks = await getMocks();
                newPost = mocks.newPost;
                forecastData = mocks.forecastData;
                stub = sinon.stub(postsUtil, 'getPost').callsFake(async () => {
                    return {post: newPost}
                });
                await investarenaForecastHelper.updatePostWithForecast({
                    author: newPost.author,
                    permlink: newPost.permlink,
                    forecast: forecastData.wia
                });
                updatedPost = await Post.findOne({author: newPost.author, permlink: newPost.permlink}).lean();
            });

            after(function () {
                stub.restore();
            });

            it('should create post after updating', async () => {
                expect(updatedPost).to.exist;
            });

            it('should include field "forecast"', async () => {
                expect(updatedPost.forecast).to.exist;
            });

            it('should include all nested keys of forecast data', async () => {
                expect(updatedPost.forecast).to.have.all.keys(Object.keys(forecastData.wia))
            });

            it('should have equal forecast data with source forecast data', async () => {
                expect(updatedPost.forecast).to.deep.equal(forecastData.wia)
            });

            it('should be called "postsUtil.getPost"', async () => {
                expect(stub.calledOnce).to.be.true;
            });
        });
    });

    describe('update post with Forecast by "exp_forecast"', async () => {
        describe('when parent post with forecast', async () => {
            let postWithForecast;
            let expForecastData;
            let updatedPost;
            let forecastData;
            let updatePostRes;

            before(async () => {
                const mocksData = await getMocks();
                forecastData = mocksData.forecastData;
                expForecastData = mocksData.expForecastData;
                postWithForecast = await PostFactory.Create({
                    additionsForPost: {
                        forecast: forecastData.wia
                    }
                });
                updatePostRes = await investarenaForecastHelper.updatePostWithExpForecast({
                    parent_author: postWithForecast.author,
                    parent_permlink: postWithForecast.permlink,
                    author: 'z1wo5',
                    exp_forecast: expForecastData.exp_forecast
                });
                updatedPost = await Post.findOne({
                    author: postWithForecast.author,
                    permlink: postWithForecast.permlink
                }).lean();
            });

            it('should return "true"', async () => {
                expect(updatePostRes).to.be.true;
            });

            it('should add "exp_forecast" to post', async () => {
                expect(updatedPost.exp_forecast).to.exist
            });

            it('should have correct exp_forecast data', async () => {
                expect(updatedPost.exp_forecast).to.deep.equal(expForecastData.exp_forecast);
            });

            describe('with not valid bot name(supp. exp. forecast bot)', async () => {
                before(async () => {
                    postWithForecast = await PostFactory.Create({
                        additionsForPost: {
                            forecast: forecastData.wia
                        }
                    });
                    updatePostRes = await investarenaForecastHelper.updatePostWithExpForecast({
                        parent_author: postWithForecast.author,
                        parent_permlink: postWithForecast.permlink,
                        author: 'notsuppbotname',
                        exp_forecast: expForecastData.exp_forecast
                    });
                    updatedPost = await Post.findOne({
                        author: postWithForecast.author,
                        permlink: postWithForecast.permlink
                    }).lean();
                });

                it('should return "false"', async () => {
                    expect(updatePostRes).to.be.false;
                });

                it('should not add exp_forecast to post', async () => {
                    expect(updatePostRes.exp_forecast).to.be.undefined;
                });
            });
        });

        describe('when parent post without forecast', async () => {
            let postWithoutForecast;
            let expForecastData;
            let postAfterUpdate;
            let updatePostRes;
            before(async () => {
                const mocks = await getMocks();
                expForecastData = mocks.expForecastData;
                postWithoutForecast = await PostFactory.Create();
                updatePostRes = await investarenaForecastHelper.updatePostWithExpForecast({
                    parent_author: postWithoutForecast.author,
                    parent_permlink: postWithoutForecast.permlink,
                    exp_forecast: expForecastData.exp_forecast
                });
                postAfterUpdate = await Post.findOne({
                    author: postWithoutForecast.author,
                    permlink: postWithoutForecast.permlink
                });
            });

            it('should return "false"', async () => {
                expect(updatePostRes).to.be.false;
            });

            it('should not add "exp_forecast" to post', async () => {
                expect(postAfterUpdate.exp_forecast).to.not.exist;
            });
        });
    });
});


