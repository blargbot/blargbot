const { Logic } = require.main.require('./Tag/Classes');

class IfTag extends Logic {
  constructor(client) {
    super(client, {
      name: 'if',
      args: [
        {
          name: 'value'
        }, {
          name: 'then'
        }, {
          name: 'else',
          optional: true
        }
      ],
      minArgs: 2
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args, false);
    args = args.parsedArgs;
    let val = (await ctx.processSub(args.value)).join('');
    let content = [];
    if (val.toLowerCase() === 'true' || val === '1' || val == true) {
      content = await ctx.processSub(args.then);
    } else if (val.toLowerCase() === 'false' || val === '0' || val == false) {
      if (args.else)
        content = await ctx.processSub(args.else);
    } else {
      throw new this.TagError('error.tag.notbool', {
        name: 'value',
        value: val
      });
    }

    return res.setContent(content);
  }

}

module.exports = IfTag;