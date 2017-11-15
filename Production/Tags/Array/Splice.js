const { Array } = require.main.require('./Tag/Classes');

class SpliceTag extends Array {
  constructor(client) {
    super(client, {
      name: 'splice',
      args: [
        {
          name: 'array'
        }, {
          name: 'start'
        }, {
          name: 'deleteCount',
          optional: true
        }, {
          name: 'items',
          optional: true,
          repeat: true
        }
      ],
      minArgs: 2
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args, true);
    args = args.parsedArgs;
    let arr = await this.loadArray(ctx, args.array);

    let start = this.parseInt(args.start, 'start');
    let deleteCount = args.deleteCount ? this.parseInt(args.deleteCount, 'deleteCount') : arr.length - start;
    let insert = args.items || [];

    let newArr = new this.TagArray(...arr.splice(start, deleteCount, ...insert));
    if (arr.ctx && arr.name) await arr.save();

    return res.setContent(newArr);
  }
}

module.exports = SpliceTag;