const { runCustomStream } = require('utilities/helpers/customStreamHelper');
const { reblogParseSwitcher } = require('./parser');

(async () => {
  await runCustomStream(
    {
      startBlock: +process.argv[4],
      finishBlock: +process.argv[3],
      key: process.argv[2],
      callback: reblogParseSwitcher,
    },
  );
  process.exit();
})();
