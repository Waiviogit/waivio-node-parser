const {createObjectType, createObject, appendObject} = require('../../utilities/objectBotApi');
const axios = require('axios');
const {expect, sinon} = require('../testHelper');

describe('ObjectBotApi', async () => {
    describe('createObjectType', async () => {
        describe('with valid data', async () => {
            let objBotResponse;
            let stubAxios;
            before(async () => {
                stubAxios = sinon.stub(axios, 'post').callsFake(async (u, d) => {
                    if (d.objectType) {
                        return {
                            data: {
                                transactionId: '12315',
                                author: 'lalalala',
                                permlink: 'lalalwerw'
                            }
                        }
                    }
                });
                objBotResponse = await createObjectType.send({
                    objectType: 'ObjectTypeForTesting2'
                });
            });

            after(function () {
                stubAxios.restore();
            });

            it('should return transactionId, author, permlink', async () => {
                expect(objBotResponse).to.include.all.keys('transactionId', 'author', 'permlink');
            });

            it('should not return error with valid data', async () => {
                expect(objBotResponse).to.not.have.key('error');
            });

            it('should return valid data', async () => {
                expect(objBotResponse).to.deep.equal({
                    transactionId: '12315',
                    author: 'lalalala',
                    permlink: 'lalalwerw'
                })
            });
        });

        describe('with not valid input data', async () => {
            let objBotResponse;
            let stubAxios;
            before(async () => {
                stubAxios = sinon.stub(axios, 'post').callsFake(async (u, d) => {
                    if (d.objectType) {
                        return {
                            data: {
                                transactionId: '12315',
                                author: 'lalalala',
                                permlink: 'lalalwerw'
                            }
                        }
                    }
                });
                objBotResponse = await createObjectType.send({});
            });

            after(function () {
                stubAxios.restore();
            });

            it('should return error', async () => {
                expect(objBotResponse).to.have.key('error');
            });

            it('should not call "axios.post"', async () => {
                expect(stubAxios.notCalled).to.be.true;
            });
        });
    });

    describe('createObject', async () => {
        let stubAxios;

        before(async () => {
            stubAxios = sinon.stub(axios, 'post').callsFake(async (u, d) => {
                if (d) {
                    return {
                        data: {
                            transactionId: "9d280697020ffddfaa910ec4c793ccf6af98fc1d",
                            author: "guest123",
                            permlink: "jucci-u43vzi5p9n",
                            parentAuthor: "social",
                            parentPermlink: "exf-a8d56fdf6"
                        }
                    }
                }
            });
        });

        after(function () {
            stubAxios.restore()
        });

        describe('with valid data', async () => {

            let objBotResponse;

            before(async () => {
                objBotResponse = await createObject.send({
                    author: "jucci",
                    title: "newObject - test",
                    body: "Waivio object \"test\" has been created!",
                    permlink: "exf-a8d56fdf6",
                    objectName: "test",
                    locale: "en-US",
                    isExtendingOpen: true,
                    isPostingOpen: true,
                    parentAuthor: "guest123",
                    parentPermlink: "c4hm78o9jc-test"
                });
            });

            after(function () {
                stubAxios.restore();
            });

            it('should return transactionId, author, permlink', async () => {
                expect(objBotResponse).to.include.all.keys('transactionId', 'author', 'permlink', 'parentAuthor', 'parentPermlink');
            });

            it('should not return error with valid data', async () => {
                expect(objBotResponse).to.not.have.key('error');
            });

            it('should return valid data', async () => {
                expect(objBotResponse).to.deep.equal({
                    transactionId: "9d280697020ffddfaa910ec4c793ccf6af98fc1d",
                    author: "guest123",
                    permlink: "jucci-u43vzi5p9n",
                    parentAuthor: "social",
                    parentPermlink: "exf-a8d56fdf6"
                })
            });
        });

        describe('with not valid input data', async () => {
            let objBotResponse;
            before(async () => {
                stubAxios = sinon.stub(axios, 'post').callsFake(async (u, d) => {
                    if (d) {
                        return {
                            data: {
                                transactionId: "9d280697020ffddfaa910ec4c793ccf6af98fc1d",
                                author: "guest123",
                                permlink: "jucci-u43vzi5p9n",
                                parentAuthor: "social",
                                parentPermlink: "exf-a8d56fdf6"
                            }
                        }
                    }
                });
                objBotResponse = await createObject.send({});
            });

            after(function () {
                stubAxios.restore();
            });

            it('should return error', async () => {
                expect(objBotResponse).to.have.key('error');
            });

            it('should not call "axios.post"', async () => {
                expect(stubAxios.notCalled).to.be.true;
            });
        });
    });

    describe('appendObject', async () => {
        let stubAxios;

        before(async () => {
            stubAxios = sinon.stub(axios, 'post').callsFake(async (u, d) => {
                if (d) {
                    return {
                        data: {
                            transactionId: "f9f780d99116e2e3d45392d72ce3832cf0d680d0",
                            author: "guest123",
                            permlink: "lalallalalal",
                            parentAuthor: "social",
                            parentPermlink: "exf-a8d56fdf6"
                        }
                    }
                }
            });
        });

        after(function () {
            stubAxios.restore()
        });

        describe('with valid data', async () => {

            let objBotResponse;

            before(async () => {
                objBotResponse = await appendObject.send({
                    author: "jucci",
                    body: " jucci added field",
                    title: "Image",
                    permlink: "lalallalalal",
                    parentAuthor: "social",
                    parentPermlink: "exf-a8d56fdf6",
                    field: {
                        name: "image",
                        body: "http://www.liberaldictionary.com/wp-content/uploads/2018/11/test-1.png",
                        locale: "en-US"
                    }
                });
            });

            after(function () {
                stubAxios.restore();
            });

            it('should return transactionId, author, permlink', async () => {
                expect(objBotResponse).to.include.all.keys('transactionId', 'author', 'permlink', 'parentAuthor', 'parentPermlink');
            });

            it('should not return error with valid data', async () => {
                expect(objBotResponse).to.not.have.key('error');
            });

            it('should return valid data', async () => {
                expect(objBotResponse).to.deep.equal({
                    transactionId: "f9f780d99116e2e3d45392d72ce3832cf0d680d0",
                    author: "guest123",
                    permlink: "lalallalalal",
                    parentAuthor: "social",
                    parentPermlink: "exf-a8d56fdf6"
                })
            });
        });

        describe('with not valid input data', async () => {
            let objBotResponse;
            before(async () => {
                stubAxios.restore();
                stubAxios = sinon.stub(axios, 'post').callsFake(async (u, d) => {
                    if (d) {
                        return {
                            data: {
                                transactionId: "f9f780d99116e2e3d45392d72ce3832cf0d680d0",
                                author: "guest123",
                                permlink: "lalallalalal",
                                parentAuthor: "social",
                                parentPermlink: "exf-a8d56fdf6"
                            }
                        }
                    }
                });
                objBotResponse = await appendObject.send({});
            });

            after(function () {
                stubAxios.restore();
            });

            it('should return error', async () => {
                expect(objBotResponse).to.have.key('error');
            });

            it('should not call "axios.post"', async () => {
                expect(stubAxios.notCalled).to.be.true;
            });
        });
    });
});
