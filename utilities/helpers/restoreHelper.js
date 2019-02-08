const {Wobj} = require('../../models');

const restore = async function () {
    await restoreWobjectParents();

};

const restoreWobjectParents = async function(){
    const {fields} = await Wobj.getSomeFields('parent');
    if(fields && Array.isArray(fields)){
        for(const parents  of fields){
            if(parents && parents.fields && Array.isArray(parents.fields)){
                await Wobj.update({author_permlink: parents.author_permlink}, {parents: parents.fields.slice(0, 5)})
            }
        }
    }
};


module.exports = {restore}