const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ({ns: 'rsmq', realtime: true, options: {db: 10}});

const createQueue = async () => {
    try {
        const res = await rsmq.createQueueAsync({qname: "object_queue"});
        if (res === 1) {
            return {result: true};
        } else {
            result: false
        }
    } catch (e) {
        return {error: e}
    }
}
const sendMessage = async () => {
    const la = JSON.stringify({
        type: 'objectType',
        name: Math.random()
    });
    const res = await rsmq.sendMessageAsync({qname: "object_queue", message: la});
    if (res) {
        console.log("Message sent. ID:", res);
    }
};

const receiveMessage = async () => {
    const resp = await rsmq.receiveMessageAsync({qname: "object_queue"});
    if (resp.id) {
        // await new Promise(f => setTimeout(f, 400));
        console.log("Message received.", resp);
        const mess = JSON.parse(resp.message);
        console.log('TYPE:  ', mess ? mess.type : null);
        // await new Promise(f => setTimeout(f, 1500));
        const delResp = await rsmq.deleteMessageAsync({qname: 'object_queue', id: resp.id});
        if (delResp === 1) {
            await new Promise(f => setTimeout(f, 500));
            console.log(`Message: "${resp.message}" deleted!`);
            return true;
        }
    } else {
        console.log('No messages for me...');
        return false;
    }
};

(async () => {
    const {result, error} = await createQueue();
    if (error) {
        console.error(error.message);
    }
    for (let i = 0; i < 5; i++) {
        await sendMessage();
    }
    let delMessage = true;
    let counter = 0;
    while (delMessage) {
        delMessage = await receiveMessage();
        if (!delMessage) {
            await new Promise(f => setTimeout(f, 100));
            delMessage = true;
        }
        if(counter === 5000){
            await sendMessage();
        }
        counter++;
    }
})()
