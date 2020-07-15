const { runCustomStream } = require('utilities/helpers/customStreamHelper');
const { usersParseSwitcher } = require('./parser');

(async () => {
  await runCustomStream(
    {
      startBlock: +process.argv[4],
      finishBlock: +process.argv[3],
      key: process.argv[2],
      callback: usersParseSwitcher,
    },
  );
})();
