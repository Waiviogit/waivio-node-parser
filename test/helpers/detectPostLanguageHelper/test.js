const {
  sinon, expect, detectPostLanguageHelper, User,
} = require('../../testHelper');

describe('detectPostLanguageHelper', async () => {
  describe('on valid input data', async () => {
    describe('without user preferences', async () => {
      const cases = [
        {
          params: { title: 'title in english language', body: 'This is body in english language!', author: 'kek' },
          exp_result: 'en-US',
        },
        {
          params: { title: 'Это заголовок на русском', body: 'Это тело сообщения тоже на русском', author: 'lalal' },
          exp_result: 'ru-RU',
        },
        {
          params: { title: 'Este é um cabeçalho padrão em diferentes idiomas.', body: 'Este é um exemplo de teste em português. Espero que o teste seja bem-sucedido e tudo corra bem.', author: 'lalal' },
          exp_result: 'pt-BR',
        },
        {
          params: { title: 'Questa è un\'intestazione standard in diverse lingue.', body: 'Questo è un esempio di test in italiano. Spero che il test avrà successo e tutto andrà bene.', author: 'lalal' },
          exp_result: 'it-IT',
        },
        {
          params: { title: 'これは、さまざまな言語の標準ヘッダーです。', body: 'これは日本語のテストの例です。 テストが成功し、すべてがうまくいくことを願っています。', author: 'lalal' },
          exp_result: 'ja-JP',
        },
      ];
      beforeEach(() => {
        sinon.stub(User, 'findOne').callsFake(async () => ({}));
      });
      afterEach(() => {
        User.findOne.restore();
      });

      for (const test of cases) {
        it(`should correct detect language for post with title ${test.params.title}`, async () => {
          const lang = await detectPostLanguageHelper(test.params);
          expect(lang).to.eq(test.exp_result);
        });
      }
    });
  });
});
