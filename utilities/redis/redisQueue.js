const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ({ns: 'rsmq', realtime: true, options: {db: 10}});

const createQueue = async () => {
    rsmq.createQueueAsync({qname: "object_queue"}).then(function (resp) {
        if (resp === 1) {
            console.log("queue 'object_queue' created")
        }
    });
};

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
        await new Promise(f => setTimeout(f, 400));
        console.log("Message received.", resp);
        const mess = JSON.parse(resp.message);
        console.log('TYPE:  ', mess.type);
        await new Promise(f => setTimeout(f, 1500));
        const delResp = await rsmq.deleteMessageAsync({qname: 'object_queue', id: resp.id});
        if (delResp === 1) {
            await new Promise(f => setTimeout(f, 900));
            console.log(`Message: "${resp.message}" deleted!`);
            return true;
        }
    } else {
        console.log('No messages for me...');
        return false;
    }
};

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// createQueue();
(async () => {
    for(let i = 0; i<5 ; i++){
        await sendMessage();
    }
    let delMessage = true;
    while(delMessage){
        delMessage = await receiveMessage();
        if(!delMessage){
            await new Promise(f => setTimeout(f, 3000));
            delMessage = true;
        }
    }
})();



