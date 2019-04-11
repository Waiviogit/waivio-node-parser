const {
    expect, sinon, importObjectsService, receiveMessage, sendMessage, deleteMessage, importRsmqClient, redisSetter,
    redisGetter, importWobjectsDataClient, createQueue, redis, redisQueue, Mongoose
} = require('../testHelper');
const {ObjectTypeFactory} = require('../factories/');
const {createObjectType, createObject, appendObject} = require('../../utilities/objectBotApi');
const {runImportWobjectsQueue} = require('../../utilities/services/importObjectsService');
const axios = require('axios');

describe('Import Wobjects to BlockChain', async () => {
    before(async () => {
        await createQueue({client: importRsmqClient, qname: 'import_wobjects'});
    });
    describe('on step receive messages', async () => {
        describe('when get create "objectType" message', async () => {
            describe('with valid data', async () => {
                let createObjTypeStub;
                before(async () => {
                    createObjTypeStub = sinon.stub(createObjectType, 'send').callsFake(async (data) => {
                        console.log(data);
                        return {
                            transactionId: '123123',
                            author: 'abcabcabc',
                            permlink: 'abcdefghij'
                        }
                    });
                    runImportWobjectsQueue();
                    await sendMessage({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: 'wobj-type:testObjType'
                    });
                    await redisSetter.setImportWobjData('wobj-type:testObjType', {objectType: 'testObjType'});
                    await new Promise(r => setTimeout(r, 500));
                });

                after(async () => {
                    createObjTypeStub.restore();
                });

                it('should call createObjectType once', async () => {
                    expect(createObjTypeStub.calledOnce).to.be.true;
                });

                it('should delete from redis importWobjectsData data about wobj-type', async () => {
                    expect(await redisGetter.getHashAll('wobj-type:testObjType', importWobjectsDataClient)).to.be.null;
                });

                it('should call createObject with args', async () => {
                    const arg = createObjTypeStub.getCall(0).args[0];
                    expect(arg).to.deep.equal({objectType: 'testObjType'})
                });
            });
            describe('when data is not valid', async () => {
                let axiosStub;
                let createObjTypeSpy;
                before(async () => {
                    createObjTypeSpy = sinon.spy(createObjectType, 'send');
                    axiosStub = sinon.stub(axios, 'post').callsFake(async (data) => {
                        console.log(data);
                        return {
                            transactionId: '123123',
                            author: 'abcabcabc',
                            permlink: 'abcdefghij'
                        }
                    });
                    runImportWobjectsQueue();
                    await sendMessage({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: 'wobj-type:testObjType'
                    });
                    await redisSetter.setImportWobjData('wobj-type:testObjType', {lala: 'lala'});
                    await new Promise(r=>setTimeout(r,500));
                });

                after(function () {
                    axiosStub.restore();
                    createObjTypeSpy.restore();
                });

                it('should call createObjectType once', async () => {
                    expect(createObjTypeSpy.calledOnce).to.be.true;
                });

                it('should not call axios "post"', async () => {
                    expect(axiosStub.notCalled).to.be.true;
                });

            });
        });

        describe('when get create "wobject" message', async () => {
            describe('when valid data', async () => {
                let createWobjStub;
                before(async () => {
                    createWobjStub = sinon.stub(createObject, 'send').callsFake(async (data) => {
                        return {
                            transactionId: '123123',
                            author: 'abcabcabc',
                            permlink: 'abcdefghij',
                            parentAuthor: 'lalaauthor',
                            parentPermlink: 'lalapermlink'
                        }
                    });
                    runImportWobjectsQueue();
                    await redisSetter.setImportWobjData('wobj:abc-testwobject', {
                        author: 'author',
                        permlink: 'permlink',
                        parentAuthor: 'someAuthor',
                        parentPermlink: 'somePermlink',
                        isPostingOpen: true,
                        isExtendingOpen: true,
                        objectName: 'somename',
                        locale: 'en-US',
                        title: 'some title',
                        body: 'some body'
                    });
                    await sendMessage({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: 'wobj:abc-testwobject'
                    });
                    await new Promise(r => setTimeout(r, 1000));
                });
                after(async () => {

                    createWobjStub.restore();
                });
                it('should call createWobj once', async () => {
                    expect(createWobjStub.calledOnce).to.be.true;
                });

                it('should delete from redis importWobjectsData data about wobj', async () => {
                    await new Promise(r => setTimeout(r, 1000));
                    const redisWobjData = await redisGetter.getHashAll('wobj:abc-testwobject', importWobjectsDataClient);
                    expect(redisWobjData).to.be.null;
                });

                it('should call createObject with args', async () => {
                    const arg = createWobjStub.getCall(0).args[0];
                    expect(arg).to.deep.equal({
                        author: 'author',
                        permlink: 'permlink',
                        parentAuthor: 'someAuthor',
                        parentPermlink: 'somePermlink',
                        isPostingOpen: 'true',
                        isExtendingOpen: 'true',
                        objectName: 'somename',
                        locale: 'en-US',
                        title: 'some title',
                        body: 'some body'
                    })
                });


            });

            describe('when data is not valid', async () => {
                let axiosStub;
                let createObjSpy;
                before(async () => {
                    await redis.importWobjectsQueueClient.flushdbAsync();
                    await createQueue({
                        client: importRsmqClient,
                        qname: 'import_wobjects'
                    });
                    createObjSpy = sinon.spy(createObject, 'send');
                    axiosStub = sinon.stub(axios, 'post').callsFake(async (data) => {
                        console.log(data);
                        return {
                            transactionId: '123123',
                            author: 'abcabcabc',
                            permlink: 'abcdefghij',
                            parentAuthor: 'adsfqwer',
                            parentPermlink: 'asdfqewrrt'
                        }
                    });
                    runImportWobjectsQueue();
                    await sendMessage({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: 'wobj:test-object'
                    });
                    await redisSetter.setImportWobjData('wobj:test-object', {
                        parentAuthor: 'lalalla',
                        parentPermlink: 'lalalla'
                    });
                    await new Promise(r => setTimeout(r, 1500));
                });

                after(function () {
                    axiosStub.restore();
                    createObjSpy.restore();
                });

                it('should not call axios "post"', async () => {
                    expect(axiosStub.notCalled).to.be.true;
                });

            });
        });

        describe('when get create "append" message', async () => {
            let appendWobjStub;
            before(async () => {
                appendWobjStub = sinon.stub(appendObject, 'send').callsFake(async (data) => {
                    return {
                        transactionId: '123123',
                        author: 'abcabcabc',
                        permlink: 'abcdefghij',
                        parentAuthor: 'lalaauthor',
                        parentPermlink: 'lalapermlink'
                    }
                });
                runImportWobjectsQueue();
                await redisSetter.setImportWobjData('append:abc-testwobject_lalapermlink', {
                    author: 'author',
                    permlink: 'permlink',
                    parentAuthor: 'someAuthor',
                    parentPermlink: 'somePermlink',
                    title: 'some title',
                    body: 'some body',
                    field: JSON.stringify({
                        name: 'someName',
                        body: 'someBody',
                        locale: 'someLocale'
                    })
                });
                await sendMessage({
                    client: importRsmqClient,
                    qname: 'import_wobjects',
                    message: 'append:abc-testwobject_lalapermlink'
                });
                await new Promise(r => setTimeout(r, 1000));
            });

            after(async () => {
                appendWobjStub.restore();
            });

            it('should call appendWobj once', async () => {
                expect(appendWobjStub.calledOnce).to.be.true;
            });

            it('should delete from redis importWobjectsData data about append wobj', async () => {
                await new Promise(r => setTimeout(r, 1000));
                const redisWobjData = await redisGetter.getHashAll('append:abc-testwobject_lalapermlink', importWobjectsDataClient);
                expect(redisWobjData).to.be.null;
            });

            it('should call append wobj with args', async () => {
                const arg = appendWobjStub.getCall(0).args[0];
                expect(arg).to.deep.equal({
                    author: 'author',
                    permlink: 'permlink',
                    parentAuthor: 'someAuthor',
                    parentPermlink: 'somePermlink',
                    title: 'some title',
                    body: 'some body',
                    field: {
                        name: 'someName',
                        body: 'someBody',
                        locale: 'someLocale'
                    }
                })
            });
        });
    });

    describe('on step add new messages', async () => {
        describe('when add new wobjects', async () => {
            let mockWobject = {
                "author_permlink": "abc-basic-attention-token",
                "object_type": "trading_tool",
                "default_name": "abc-basic-attention-token",
                "is_extending_open": false,
                "is_posting_open": false,
                "creator": "monterey",
                "fields": [{
                    "name": "tag",
                    "body": "bat",
                    "creator": "monterey",
                    "permlink": "lala-tag-bat"
                }, {
                    "name": "tag",
                    "body": "basic-attention-token",
                    "creator": "monterey",
                    "permlink": "lala-tag-basic-attention-token"
                }]
            };
            before(async () => {
                await Mongoose.connection.dropDatabase();
            });

            describe('with new objectType', async () => {
                let sendMessSpy;
                before(async () => {
                    await redis.importWobjectsQueueClient.flushdbAsync();
                    await redis.importWobjectsDataClient.flushdbAsync();
                    await createQueue({
                        client: importRsmqClient,
                        qname: 'import_wobjects'
                    });
                    sendMessSpy = sinon.spy(redisQueue, 'sendMessage');
                    await importObjectsService.addWobjectsToQueue({wobjects: [mockWobject]});
                });
                after(function () {
                    sendMessSpy.restore();
                });

                it('should call "sendMessage" 4 times', async () => {
                    expect(sendMessSpy.callCount).to.be.equal(4);
                });

                it('should add objectType data to redis', async () => {
                    const key = `wobj-type:${mockWobject.object_type}`;
                    const redisResp = await redisGetter.getHashAll(key, importWobjectsDataClient);
                    expect(redisResp).to.exist;
                    expect(redisResp).to.have.key('objectType');
                });

                it('should add wobject data to redis', async () => {
                    const key = `wobj:${mockWobject.author_permlink}`;
                    const redisResp = await redisGetter.getHashAll(key, importWobjectsDataClient);
                    expect(redisResp).to.exist;
                    expect(redisResp).to.have.all.keys("author", "body", "isExtendingOpen", "isPostingOpen", "locale",
                        "objectName", "parentAuthor", "parentPermlink", "permlink", "title", "objectType");
                });

                it('should add wobject data to redis with empty parentAuthor and ParentPermlink', async () => {
                    const key = `wobj:${mockWobject.author_permlink}`;
                    const redisResp = await redisGetter.getHashAll(key, importWobjectsDataClient);
                    expect(redisResp.parentAuthor).to.equal('');
                    expect(redisResp.parentPermlink).to.equal('');
                });

                it('should add wobject data to redis with objectType key', async () => {
                    const key = `wobj:${mockWobject.author_permlink}`;
                    const redisResp = await redisGetter.getHashAll(key, importWobjectsDataClient);
                    expect(redisResp.objectType).to.equal(mockWobject.object_type);
                });

                it('should add appends data to redis', async () => {
                    const key = `append:${mockWobject.author_permlink}_${mockWobject.fields[0].permlink}`;
                    const redisResp = await redisGetter.getHashAll(key, importWobjectsDataClient);
                    expect(redisResp).to.exist;
                    expect(redisResp).to.have.all.keys("author", "body", "field", "parentAuthor", "parentPermlink", "permlink", "title");
                });

                it('should add append data to redis with empty parentAuthor', async () => {
                    const key = `append:${mockWobject.author_permlink}_${mockWobject.fields[0].permlink}`;
                    const redisResp = await redisGetter.getHashAll(key, importWobjectsDataClient);
                    expect(redisResp.parentAuthor).to.equal('');
                });

                it('should first call "sendMessage" with create wobjType params', async () => {
                    let firstCallSpy = sendMessSpy.getCall(0);
                    expect(firstCallSpy.calledWithExactly({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: `wobj-type:${mockWobject.object_type}`
                    })).to.be.true;
                });

                it('should second call "sendMessage" with create wobj params', async () => {
                    let firstCallSpy = sendMessSpy.getCall(1);
                    expect(firstCallSpy.calledWithExactly({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: `wobj:${mockWobject.author_permlink}`,
                    })).to.be.true;
                });

                it('should third call "sendMessage" with append wobject params', async () => {
                    let firstCallSpy = sendMessSpy.getCall(2);
                    expect(firstCallSpy.calledWithExactly({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: `append:${mockWobject.author_permlink}_${mockWobject.fields[0].permlink}`,
                    })).to.be.true;
                });

                it('should fourth call "sendMessage" with append wobject params', async () => {
                    let firstCallSpy = sendMessSpy.getCall(3);
                    expect(firstCallSpy.calledWithExactly({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: `append:${mockWobject.author_permlink}_${mockWobject.fields[1].permlink}`,
                    })).to.be.true;
                });
            });

            describe('with existing objectType', async () => {
                let sendMessSpy;
                let objectType;
                before(async () => {
                    await redis.importWobjectsQueueClient.flushdbAsync();
                    await redis.importWobjectsDataClient.flushdbAsync();
                    objectType = await ObjectTypeFactory.Create();
                    mockWobject.object_type = objectType.name;
                    await createQueue({
                        client: importRsmqClient,
                        qname: 'import_wobjects'
                    });
                    sendMessSpy = sinon.spy(redisQueue, 'sendMessage');
                    await importObjectsService.addWobjectsToQueue({wobjects: [mockWobject]});
                });
                after(function () {
                    sendMessSpy.restore();
                });

                it('should call "sendMessage" 3 times', async () => {
                    expect(sendMessSpy.callCount).to.be.equal(3);
                });

                it('should not add objectType data to redis', async () => {
                    const key = `wobj-type:${mockWobject.object_type}`;
                    const redisResp = await redisGetter.getHashAll(key, importWobjectsDataClient);
                    expect(redisResp).to.not.exist;
                });

                it('should not first call "sendMessage" with create wobjType params', async () => {
                    let firstCallSpy = sendMessSpy.getCall(0);
                    expect(firstCallSpy.calledWithExactly({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: `wobj-type:${mockWobject.object_type}`
                    })).to.be.false;
                });

                it('should first call "sendMessage" with create wobj params', async () => {
                    let firstCallSpy = sendMessSpy.getCall(0);
                    expect(firstCallSpy.calledWithExactly({
                        client: importRsmqClient,
                        qname: 'import_wobjects',
                        message: `wobj:${mockWobject.author_permlink}`
                    })).to.be.true;
                });

                it('should add wobject data to redis', async () => {
                    const key = `wobj:${mockWobject.author_permlink}`;
                    const redisResp = await redisGetter.getHashAll(key, importWobjectsDataClient);
                    expect(redisResp).to.exist;
                    expect(redisResp).to.have.all.keys("author", "body", "isExtendingOpen", "isPostingOpen", "locale",
                        "objectName", "parentAuthor", "parentPermlink", "permlink", "title", "objectType");
                });

                it('should add wobject data to redis with valid parentAuthor and parentPermlink', async () => {
                    const key = `wobj:${mockWobject.author_permlink}`;
                    const redisResp = await redisGetter.getHashAll(key, importWobjectsDataClient);
                    expect(redisResp.parentAuthor).to.equal(objectType.author);
                    expect(redisResp.parentPermlink).to.equal(objectType.permlink);
                });
            });
        });
    });
});
