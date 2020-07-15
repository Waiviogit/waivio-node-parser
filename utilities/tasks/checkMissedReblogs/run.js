const { runReblogStream } = require('./stream');

(async () => {
  await runReblogStream(
    {
      startBlock: +process.argv[4],
      finishBlock: +process.argv[3],
      key: process.argv[2],
    },
  );
  process.exit();
})();
