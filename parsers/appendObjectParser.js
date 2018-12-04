const {Wobj} = require('../models');
const {wobjectValidator} = require('../validator');

const appendObject = async function (data) {
    try {
        if (!wobjectValidator.validateAppendObject(data)) {
            throw new Error('Data is not valid');
        }
        const {result, error} = await Wobj.addField(data);
        if (error) {
            throw error;
        }
        return result;

    } catch (error) {
        throw error;
    }
};

module.exports = {appendObject};