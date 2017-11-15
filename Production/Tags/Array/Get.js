const { Array } = require.main.require('./Tag/Classes');

class GetTag extends Array {
  constructor(client) {
    super(client, {
      name: 'get',
      args: [
        {
          name: 'array'
        }, {
          name: 'index'
        }
      ],
      minArgs: 2, maxArgs: 2
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args, true);
    args = args.parsedArgs;
    let arr = await this.loadArray(ctx, args.array);
    let index = this.parseInt(args.index, 'index');

    return res.setContent(arr[index]);
  }
  get implicit() { return false; }

}

module.exports = GetTag;