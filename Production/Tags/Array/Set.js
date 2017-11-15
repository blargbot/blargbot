const { Array } = require.main.require('./Tag/Classes');

class SetTag extends Array {
  constructor(client) {
    super(client, {
      name: 'set',
      args: [
        {
          name: 'array'
        }, {
          name: 'index'
        }, {
          name: 'value'
        }
      ],
      minArgs: 3, maxArgs: 3
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args, true);
    args = args.parsedArgs;
    let arr = await this.loadArray(ctx, args.array);
    let index = this.parseInt(args.index, 'index');

    arr[index] = args.value;
    await arr.save();

    return res;
  }
  get implicit() { return false; }

}

module.exports = SetTag;