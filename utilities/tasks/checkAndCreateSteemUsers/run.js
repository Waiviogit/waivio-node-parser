const { runUserStream } = require('./stream');


(async () => {
  await runUserStream({ startBlock: +process.argv[3], finishBlock: +process.argv[2] });
})();
