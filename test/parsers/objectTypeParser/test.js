const {Mongoose, objectTypeParser, ObjectType, expect} = require('../../testHelper');
const {operation, metadata} = require('./mocks');

describe('Object Type', async () => {
    describe('parser', async () => {
        beforeEach(async () => {
            Mongoose.connection.dropDatabase();
        });

        it('should create new ObjectType', async () => {
            await objectTypeParser.parse(operation, metadata);
            const createdObjectType = await ObjectType.findOne({name: metadata.wobj.name}).lean();
            expect(createdObjectType).to.not.be.undefined;
        });

        it('should not create new ObjectType if metadata is missing', async () => {
            await objectTypeParser.parse(operation);
            const createdObjectType = await ObjectType.findOne({name: metadata.wobj.name}).lean();
            expect(createdObjectType).to.be.null;
        });

        it('should not create new ObjectType if operation is missing', async () => {
            await objectTypeParser.parse(metadata);
            const createdObjectType = await ObjectType.findOne({name: metadata.wobj.name}).lean();
            expect(createdObjectType).to.be.null;
        });

    })
});
