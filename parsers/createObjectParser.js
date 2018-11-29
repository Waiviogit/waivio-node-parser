const {Wobj} = require('../models');
const {wobjectValidator} = require('../validator');

const createObject = async function (data) {
    try {
        if (!wobjectValidator.validateCreateObject(data)) {
            throw new Error('Data is not valid');
        }
        const {wObject, error} = await Wobj.create(data);
        if (error) {
            throw error;
        }
        return wObject._doc;
    } catch (error) {
        throw error;
    }
};

module.exports = {createObject};