const { Array } = require.main.require('./Tag/Classes');

class IsArrayTag extends Array {
  constructor(client) {
    super(client, {
      name: 'isarray',
      args: [
        {
          name: 'array'
        }
      ],
      minArgs: 1, maxArgs: 1
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args, true);
    args = args.parsedArgs;
    console.log(args.array);
    return res.setContent(args.array.length === 1 && args.array[0] instanceof this.TagArray);
  }
}

module.exports = IsArrayTag;