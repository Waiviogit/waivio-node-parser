const {expect, sinon, importObjectsService, receiveMessage, sendMessage, deleteMessage, importRsmqClient, redisSetter, redisGetter, importWobjectsDataClient} = require('../testHelper');
const {createObjectType, createObject, appendObject} = require('../../utilities/objectBotApi');
const {runImportWobjectsQueue} = require('../../utilities/services/importObjectsService');

describe('Import Wobjects to BlockChain', async () => {
    describe('on step receive messages', async () => {
        describe('when get create "objectType" message', async () => {
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

        describe('when get create "wobject" message', async () => {
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
                await redisSetter.setImportWobjData('wobj:abc-testwobject',{
                    author: 'author',
                    permlink:'permlink',
                    parentAuthor: 'someAuthor',
                    parentPermlink: 'somePermlink',
                    isPostingOpen: true,
                    isExtendingOpen: true,
                    objectName: 'somename',
                    locale: 'en-US',
                    title: 'some title',
                    body: 'some body'
                });
                await sendMessage({client:importRsmqClient, qname:'import_wobjects',message: 'wobj:abc-testwobject'});
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
                    permlink:'permlink',
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
    });
});
