const { runCustomStream } = require('utilities/helpers/customStreamHelper');
const postParseSwitcher = require('./parser');

(async () => {
  await runCustomStream(
    {
      key: process.argv[2],
      startBlock: +process.argv[3],
      finishBlock: +process.argv[4],
      callback: postParseSwitcher,
    },
  );
  process.exit();
})();
