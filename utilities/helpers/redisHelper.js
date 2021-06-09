const { Worker } = require('worker_threads');
const { redis } = require('utilities/redis');

const workers = [];
for (let workersCount = 0; workersCount < process.env.WORKER_THREADS; workersCount++) {
  workers[workersCount] = new Worker('./utilities/workers/ttlWorker.js');
}

const chooseWorker = () => {
  let worker, idLastWorker;
  if (!idLastWorker) {
    worker = workers[idLastWorker = 0];
  }
  if (idLastWorker !== 0 && idLastWorker < process.env.WORKER_THREADS) {
    worker = workers[idLastWorker++];
  }
  if (idLastWorker === process.env.WORKER_THREADS) {
    worker = workers[idLastWorker = 0];
  }
  return worker;
};

const expiredDataListener = async (chan, msg) => {
  const worker = chooseWorker();
  worker.postMessage(msg);
};

exports.startRedisListener = () => {
  redis.expiredListener(expiredDataListener);
};
