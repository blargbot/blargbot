const { Array } = require.main.require('./Tag/Classes');

class MapTag extends Array {
  constructor(client) {
    super(client, {
      name: 'map',
      args: [
        {
          name: 'array'
        }, {
          name: 'varName',
          optional: true
        }, {
          name: 'function'
        }
      ],
      minArgs: 2, maxArgs: 3
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args, false);
    args = args.parsedArgs;
    args.array = await ctx.processSub(args.array);
    if (args.varName)
      args.varName = await ctx.processSub(args.varName);

    let arr = await this.loadArray(ctx, args.array);
    let name = args.varName || 'i';
    let code = args.function;

    let newArr = new this.TagArray();

    for (let i = 0; i < arr.length; i++) {
      ctx.client.TagVariableManager.executeSet(ctx, name, arr[i]);
      newArr[i] = await ctx.processSub(code);
    }

    return res.setContent(newArr);
  }

}

module.exports = MapTag;