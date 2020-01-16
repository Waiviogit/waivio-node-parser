const { Wobj: WobjModel, App: AppModel, ObjectType: ObjectTypeModel, Post: PostModel, User: UserModel, CommentModel } = require( '../models' );
const sinon = require( 'sinon' );
const chai = require( 'chai' );
const sinonChai = require( 'sinon-chai' );
const chaiAsPromised = require( 'chai-as-promised' );
chai.use( sinonChai );
chai.use( chaiAsPromised );
const expect = chai.expect;
const { Mongoose } = require( '../database' );
const faker = require( 'faker' );
const wobjectOperations = require( '../utilities/tasks/appendWobjectFields/wobjectsOperations' );

faker.random.string = ( length = 5 ) => {
    return faker.internet.password( length, false, /[a-z]/ );
};

const dropDatabase = async () => {
    const { models } = require( '../database' );
    for( const model in models ) {
        await models[ model ].deleteMany();
    }
};

module.exports = {
    ...require( '../parsers' ),
    ...require( '../utilities/helpers' ),
    ...require( '../utilities/redis' ),
    ...require( '../utilities/commentRefService' ),
    ...require( '../database' ).models,
    ...require( '../validator' ),
    ...require( '../utilities/objectImportServiceApi' ),
    ...require( '../utilities/steemApi' ),
    wobjectOperations,
    chai,
    expect,
    Mongoose,
    faker,
    sinon,
    WobjModel,
    CommentModel,
    AppModel,
    ObjectTypeModel,
    PostModel,
    UserModel,
    dropDatabase
};
