const { Array } = require.main.require('./Tag/Classes');

class PopTag extends Array {
  constructor(client) {
    super(client, {
      name: 'pop',
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
    let arr = await this.loadArray(ctx, args.array);

    let popped = arr.pop();
    if (arr.ctx && arr.name) await arr.save();

    return res.setContent(popped);
  }
}

module.exports = PopTag;