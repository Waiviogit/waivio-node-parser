const { runUserStream } = require('./stream');


(async () => {
  await runUserStream(
    {
      startBlock: +process.argv[4],
      finishBlock: +process.argv[3],
      key: process.argv[2],
    },
  );
})();
