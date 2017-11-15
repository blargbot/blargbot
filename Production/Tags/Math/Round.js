const { Math } = require.main.require('./Tag/Classes');

class RoundTag extends Math {
  constructor(client) {
    super(client, {
      name: 'round',
      args: [
        {
          name: 'number'
        }, {
          name: 'places',
          optional: true
        }
      ],
      minArgs: 1, maxArgs: 2
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args);
    args = args.parsedArgs;

    let parsed = this.parseFloat(args.number, 'number');
    let places = args.places ? this.parseFloat(args.places, 'places') : 0;

    let output = global.Math.round(parsed * (10 ** places)) / (10 ** places);

    return res.setContent(output);
  }
}

module.exports = RoundTag;