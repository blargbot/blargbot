const { Math } = require.main.require('./Tag/Classes');

class ParseIntTag extends Math {
  constructor(client) {
    super(client, {
      name: 'parseint',
      args: [
        {
          name: 'number'
        }
      ],
      minArgs: 1, maxArgs: 1
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args);

    try {
      let parsed = this.parseInt(args.parsedArgs.number, 'number');
      res.setContent(parsed);
    } catch (err) {
      res.setContent('NaN');
    }

    return res;
  }
}

module.exports = ParseIntTag;