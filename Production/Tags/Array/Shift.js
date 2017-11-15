const { Array } = require.main.require('./Tag/Classes');

class ShiftTag extends Array {
  constructor(client) {
    super(client, {
      name: 'shift',
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

    let shifted = arr.shift();
    if (arr.ctx && arr.name) await arr.save();

    return res.setContent(shifted);
  }
}

module.exports = ShiftTag;