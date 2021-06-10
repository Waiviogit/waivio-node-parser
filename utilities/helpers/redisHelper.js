const _ = require('lodash');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const Sentry = require('@sentry/node');
const { Worker } = require('worker_threads');
const { redis } = require('utilities/redis');

let idLastWorker = 0;
const workers = [];
for (let worker = 0; worker < process.env.TTL_WORKER_THREADS; worker++) {
  workers[worker] = new Worker('./utilities/workers/ttlWorker.js');
}

const expiredDataListener = async (chan, msg) => {
  const worker = chooseWorker(idLastWorker);
  worker.postMessage(msg);
  worker.on('error', (error) => {
    sendSentryNotification();
    Sentry.captureException(error);
    addNewWorkers();
  });
  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
      addNewWorkers();
    }
  });
};

// eslint-disable-next-line no-return-assign
const chooseWorker = (id) => (id < process.env.TTL_WORKER_THREADS
  ? workers[idLastWorker++]
  : workers[idLastWorker = 0]);

const addNewWorkers = () => {
  const deletedWorkersCount = _.remove(workers, (w) => w.threadId === -1).length;
  for (let newWorkersCount = 0; newWorkersCount < deletedWorkersCount; newWorkersCount++) {
    workers.push(new Worker('./utilities/workers/ttlWorker.js'));
  }
};

exports.startRedisListener = () => {
  redis.expiredListener(expiredDataListener);
};
