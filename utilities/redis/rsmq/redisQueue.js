const createQueue = async ({client, qname = 'queue'}) => {
    if(!client){
        return {error:{message: 'Client is required parameter'}}
    }
    try {
        const res = await client.createQueueAsync({qname});
        if (res === 1) {
            return {result: true};
        } else {
            return {result: false}
        }
    } catch (e) {
        return {error: e}
    }
};

const sendMessage = async ({client, qname = 'queue', data}) => {
    if(!client){
        return {error:{message: 'Client is required parameter'}}
    }
    if (data) {
        let strData;
        try {
            strData = JSON.stringify(data);
        } catch (error) {
            return {error}
        }
        const res = await client.sendMessageAsync({qname, message: strData});
        if (res) {
            console.log("Message sent. ID:", res);
            return {resId: res}
        }
    }
};

const receiveMessage = async ({client, qname = 'queue'}) => {
    if(!client){
        return {error:{message: 'Client is required parameter'}}
    }
    const resp = await client.receiveMessageAsync({qname});
    if (resp && resp.id && resp.message) {
        console.log("Message received. ID:", resp);
        try {
            const message = JSON.parse(resp.message);
            if (message) {
                return {message}
            }
        } catch (error) {
            return {error}
        }
    } else {
        return {error: {message: 'No messages'}}
    }
};

const deleteMessage = async ({client, qname = 'queue', id}) => {
    if(!client){
        return {error:{message: 'Client is required parameter'}}
    }
    if (id) {
        const resp = await client.deleteMessageAsync({qname, id});
        if (resp === 1) {
            return {result: true};
        }
    } else {
        return {result: false};
    }
};

module.exports = {
    createQueue,
    sendMessage,
    receiveMessage,
    deleteMessage
};
