const {expect, sinon, importObjectsService, receiveMessage, sendMessage, deleteMessage, importRsmqClient, redisSetter, redisGetter, importWobjectsDataClient, createQueue, redis} = require('../testHelper');
const {createObjectType, createObject, appendObject} = require('../../utilities/objectBotApi');
const {runImportWobjectsQueue} = require('../../utilities/services/importObjectsService');
const axios = require('axios');

describe('Import Wobjects to BlockChain', async () => {
    before(async () => {
        await createQueue({client:importRsmqClient, qname:'import_wobjects'})
    });
    describe('on step receive messages', async () => {
        describe('when get create "objectType" message', async () => {
            describe('with valid data', async () => {
                let createObjTypeStub;
                before(async () => {
                    // await redis.importWobjectsQueueClient.flushdbAsync();
                    createObjTypeStub = sinon.stub(createObjectType, 'send').callsFake(async (data) => {
                        console.log(data);
                        return {
                            transactionId: '123123',
                            author: 'abcabcabc',
                            permlink: 'abcdefghij'
                        }
                    });
                    runImportWobjectsQueue();
                    await sendMessage({client:importRsmqClient, qname:'import_wobjects',message: 'wobj-type:testObjType'});
                    await redisSetter.setImportWobjData('wobj-type:testObjType',{objectType:'testObjType'});
                    await new Promise(r => setTimeout(r, 1000));
                });

                after(async () => {
                    createObjTypeStub.restore();
                });

                it('should call createObjectType once', async () => {
                    expect(createObjTypeStub.calledOnce).to.be.true;
                });

                it('should delete from redis importWobjectsData data about wobj-typ', async () => {
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
                    // await redis.importWobjectsQueueClient.flushdbAsync();
                    createObjTypeSpy = sinon.spy(createObjectType,'send');
                    axiosStub = sinon.stub(axios, 'post').callsFake(async (data) => {
                        console.log(data);
                        return {
                            transactionId: '123123',
                            author: 'abcabcabc',
                            permlink: 'abcdefghij'
                        }
                    });
                    runImportWobjectsQueue();
                    await sendMessage({client:importRsmqClient, qname:'import_wobjects',message: 'wobj-type:testObjType'});
                    await redisSetter.setImportWobjData('wobj-type:testObjType',{lala:'lala'});
                    await new Promise(r => setTimeout(r, 1000));
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
                    // await redis.importWobjectsQueueClient.flushdbAsync();
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

                it('should delete from redis importWobjectsData data about wobj-typ', async () => {
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
                    await createQueue({client:importRsmqClient, qname:'import_wobjects',message: 'wobj:test-object'});
                    createObjSpy = sinon.spy(createObject,'send');
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
                    await new Promise(r => setTimeout(r, 1000))
                    await sendMessage({client:importRsmqClient, qname:'import_wobjects',message: 'wobj:test-object'});
                    await redisSetter.setImportWobjData('wobj:test-object',{
                        parentAuthor: 'lalalla',
                        parentPermlink: 'lalalla'
                    });
                });

                after(function () {
                    axiosStub.restore();
                    createObjSpy.restore();
                });

                it('should call createObject once', async () => {
                    expect(createObjSpy.calledOnce).to.be.true;
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
                    permlink:'permlink',
                    parentAuthor: 'someAuthor',
                    parentPermlink: 'somePermlink',
                    title: 'some title',
                    body: 'some body',
                    field:{
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
            describe('with new objectType', async () => {
                before(async () => {
                    
                });
            });
        });
    });
});
