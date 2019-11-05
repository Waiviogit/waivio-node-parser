
const throwError = async () => {
    throw new MongooseError.ValidatorError( 'Some problems' );
};

module.exports = { throwError };
